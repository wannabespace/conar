import type { CollectionMethod, DatabaseMethod } from '@tamery/mongo/methods'
import type { MongoCall } from '@tamery/mongo/parse'
import { getEffect, parseScript } from '@tamery/mongo/parse'
import type { Expression } from 'acorn'
import type {
  AbstractCursor,
  AnyBulkWriteOperation,
  ClientSession,
  Collection,
  Db,
  Document,
  ExplainVerbosityLike,
  IndexSpecification,
  MongoClient,
} from 'mongodb'

import type { ResultSet, RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { mongodb, parseShellValue } from './client'

const { EJSON } = mongodb.BSON

/** Values cross IPC and HTTP as relaxed Extended JSON, the only form that keeps an ObjectId or a Decimal128 its type. */
const toWire = (value: unknown) =>
  EJSON.serialize({ value }, { relaxed: true }).value

const value = (column: string, result: unknown): ResultSet => ({
  affectedRows: null,
  columns: [column],
  rows: [[toWire(result)]],
  truncated: false,
})

const affected = (count: number): ResultSet => ({
  affectedRows: count,
  columns: [],
  rows: [],
  truncated: false,
})

const FINISHED: ResultSet = {
  affectedRows: null,
  columns: [],
  rows: [],
  truncated: false,
}

const document = (arg: unknown) => (arg ?? {}) as Document

interface Run<Target> {
  args: unknown[]
  options: { comment?: string; session?: ClientSession }
  read: (cursor: AbstractCursor) => Promise<ResultSet>
  rows: (docs: Document[]) => ResultSet
  target: Target
}

type Runner<Target> = (run: Run<Target>) => Promise<ResultSet>

const withOptions = (arg: unknown, { options }: Run<unknown>) => ({
  ...document(arg),
  ...options,
})

const command = (result: Document, { rows }: Run<unknown>) =>
  rows(
    Array.isArray(result.cursor?.firstBatch)
      ? result.cursor.firstBatch
      : [result]
  )

const one = (found: Document | null, { rows }: Run<unknown>) =>
  rows(found ? [found] : [])

const DATABASE_RUNNERS: Record<
  DatabaseMethod,
  Runner<{ client: MongoClient; db: Db }>
> = {
  adminCommand: async (run) =>
    command(
      await run.target.client
        .db('admin')
        .command(document(run.args[0]), run.options),
      run
    ),
  aggregate: (run) =>
    run.read(run.target.db.aggregate(run.args[0] as Document[], run.options)),
  createCollection: async (run) => {
    await run.target.db.createCollection(
      String(run.args[0]),
      withOptions(run.args[1], run)
    )
    return FINISHED
  },
  createView: async (run) => {
    const [name, source, pipeline, options] = run.args
    await run.target.db.createCollection(String(name), {
      ...withOptions(options, run),
      pipeline: (pipeline ?? []) as Document[],
      viewOn: String(source),
    })
    return FINISHED
  },
  dropDatabase: async ({ options, target }) => {
    await target.db.dropDatabase(options)
    return FINISHED
  },
  getCollectionInfos: async (run) =>
    run.rows(
      await run.target.db
        .listCollections(document(run.args[0]), withOptions(run.args[1], run))
        .toArray()
    ),
  getCollectionNames: async (run) => {
    const collections = await run.target.db
      .listCollections({}, { ...run.options, nameOnly: true })
      .toArray()
    return run.rows(collections.map(({ name }) => ({ name })))
  },
  runCommand: async (run) =>
    command(
      await run.target.db.command(document(run.args[0]), run.options),
      run
    ),
  stats: async (run) =>
    command(await run.target.db.command({ dbStats: 1 }, run.options), run),
  version: async ({ options, target }) => {
    const info = await target.db.admin().command({ buildInfo: 1 }, options)
    return value('version', info.version)
  },
}

const COLLECTION_RUNNERS: Record<CollectionMethod, Runner<Collection>> = {
  aggregate: (run) =>
    run.read(
      run.target.aggregate(
        run.args[0] as Document[],
        withOptions(run.args[1], run)
      )
    ),
  bulkWrite: async (run) => {
    const result = await run.target.bulkWrite(
      run.args[0] as AnyBulkWriteOperation[],
      withOptions(run.args[1], run)
    )
    return affected(
      result.insertedCount +
        result.modifiedCount +
        result.deletedCount +
        result.upsertedCount
    )
  },
  countDocuments: async (run) =>
    value(
      'count',
      await run.target.countDocuments(
        document(run.args[0]),
        withOptions(run.args[1], run)
      )
    ),
  createIndex: async (run) =>
    value(
      'name',
      await run.target.createIndex(
        run.args[0] as IndexSpecification,
        withOptions(run.args[1], run)
      )
    ),
  deleteMany: async (run) => {
    const result = await run.target.deleteMany(
      document(run.args[0]),
      withOptions(run.args[1], run)
    )
    return affected(result.deletedCount)
  },
  deleteOne: async (run) => {
    const result = await run.target.deleteOne(
      document(run.args[0]),
      withOptions(run.args[1], run)
    )
    return affected(result.deletedCount)
  },
  distinct: async (run) => {
    const values = await run.target.distinct(
      String(run.args[0]),
      document(run.args[1]),
      withOptions(run.args[2], run)
    )
    return run.rows(values.map((item) => ({ value: item })))
  },
  drop: async ({ options, target }) => {
    await target.drop(options)
    return FINISHED
  },
  dropIndex: async ({ args: [name], options, target }) => {
    await target.dropIndex(String(name), options)
    return FINISHED
  },
  dropIndexes: async ({ options, target }) => {
    await target.dropIndexes(options)
    return FINISHED
  },
  estimatedDocumentCount: async (run) =>
    value(
      'count',
      await run.target.estimatedDocumentCount(withOptions(run.args[0], run))
    ),
  find: (run) =>
    run.read(
      run.target.find(document(run.args[0]), {
        ...withOptions(run.args[2], run),
        projection: run.args[1] as Document | undefined,
      })
    ),
  findOne: async (run) =>
    one(
      await run.target.findOne(document(run.args[0]), {
        ...withOptions(run.args[2], run),
        projection: run.args[1] as Document | undefined,
      }),
      run
    ),
  findOneAndDelete: async (run) =>
    one(
      await run.target.findOneAndDelete(
        document(run.args[0]),
        withOptions(run.args[1], run)
      ),
      run
    ),
  findOneAndReplace: async (run) =>
    one(
      await run.target.findOneAndReplace(
        document(run.args[0]),
        document(run.args[1]),
        withOptions(run.args[2], run)
      ),
      run
    ),
  findOneAndUpdate: async (run) =>
    one(
      await run.target.findOneAndUpdate(
        document(run.args[0]),
        run.args[1] as Document,
        withOptions(run.args[2], run)
      ),
      run
    ),
  getIndexes: async (run) => run.rows(await run.target.indexes(run.options)),
  insertMany: async (run) => {
    const result = await run.target.insertMany(
      run.args[0] as Document[],
      withOptions(run.args[1], run)
    )
    return affected(result.insertedCount)
  },
  insertOne: async (run) => {
    await run.target.insertOne(
      document(run.args[0]),
      withOptions(run.args[1], run)
    )
    return affected(1)
  },
  renameCollection: async ({ args: [name, dropTarget], options, target }) => {
    await target.rename(String(name), {
      ...options,
      dropTarget: Boolean(dropTarget),
    })
    return FINISHED
  },
  replaceOne: async (run) => {
    const result = await run.target.replaceOne(
      document(run.args[0]),
      document(run.args[1]),
      withOptions(run.args[2], run)
    )
    return affected(result.modifiedCount + result.upsertedCount)
  },
  updateMany: async (run) => {
    const result = await run.target.updateMany(
      document(run.args[0]),
      run.args[1] as Document,
      withOptions(run.args[2], run)
    )
    return affected(result.modifiedCount + result.upsertedCount)
  },
  updateOne: async (run) => {
    const result = await run.target.updateOne(
      document(run.args[0]),
      run.args[1] as Document,
      withOptions(run.args[2], run)
    )
    return affected(result.modifiedCount + result.upsertedCount)
  },
}

const evaluate = (text: string, node: Expression) => {
  const source = text.slice(node.start, node.end)
  const parsed: unknown = parseShellValue(source, { mode: 'loose' })
  // The parser answers an expression it refuses (a function, a variable) with an empty string instead of throwing.
  if (
    parsed === '' &&
    !(node.type === 'Literal' || node.type === 'TemplateLiteral')
  ) {
    throw new Error(
      `Tamery cannot evaluate \`${source}\`: use literal values and BSON constructors like ObjectId().`
    )
  }
  return parsed
}

const rowsOf = (docs: Document[], maxRows: number): ResultSet => {
  const columns = [...new Set(docs.flatMap((doc) => Object.keys(doc)))]
  return resultSet(
    {
      affectedRows: null,
      columns,
      rows: docs.map((doc) => columns.map((column) => toWire(doc[column]))),
    },
    maxRows
  )
}

/** Keeps one document past `maxRows`, then closes the cursor: a read stops there without side effects. */
const readCursor = async (cursor: AbstractCursor, maxRows: number) => {
  const docs: Document[] = []
  for await (const doc of cursor) {
    docs.push(doc)
    if (docs.length > maxRows) {
      break
    }
  }
  await cursor.close()
  return rowsOf(docs, maxRows)
}

interface Explainable {
  explain: (verbosity?: ExplainVerbosityLike) => Promise<Document>
}

const chained =
  (call: MongoCall, text: string, maxRows: number) =>
  async (cursor: AbstractCursor) => {
    const steps = call.cursor.filter(
      ({ method }) => method !== 'toArray' && method !== 'pretty'
    )
    const explain = steps.find(({ method }) => method === 'explain')
    for (const { args, method } of steps) {
      const apply = (cursor as unknown as Record<string, unknown>)[
        method === 'projection' ? 'project' : method
      ]
      if (typeof apply !== 'function') {
        throw new TypeError(`.${method}() does not apply to ${call.method}().`)
      }
      if (method !== 'explain') {
        apply.apply(
          cursor,
          args.map((arg) => evaluate(text, arg))
        )
      }
    }
    if (!explain) {
      return readCursor(cursor, maxRows)
    }
    const [verbosity] = explain.args.map((arg) => evaluate(text, arg))
    const plan = await (cursor as unknown as Explainable).explain(
      verbosity as ExplainVerbosityLike
    )
    return rowsOf([plan], maxRows)
  }

const runCall = (
  client: MongoClient,
  call: MongoCall,
  context: Omit<Run<unknown>, 'target'>
) => {
  const db = client.db(call.database ?? undefined)
  return call.collection === null
    ? DATABASE_RUNNERS[call.method]({ ...context, target: { client, db } })
    : COLLECTION_RUNNERS[call.method]({
        ...context,
        target: db.collection(call.collection),
      })
}

export const runScript = async (
  client: MongoClient,
  {
    connectionString,
    readOnly,
    session,
    text,
  }: {
    connectionString: string
    readOnly: boolean
    session?: ClientSession
    text: string
  },
  { maxRows = Infinity, queryId }: RunOptions
) => {
  const calls = parseScript(text)
  const writing = readOnly
    ? calls.find((call) => getEffect(call) !== 'read')
    : undefined
  if (writing) {
    throw new Error(
      `This runs read-only, and ${writing.method}() can change data.`
    )
  }

  // Every call carries the query id as its comment, which is how a cancel finds the operation to kill.
  const cancel = async () => {
    const admin = client.db('admin')
    const ownOperation = { $ownOps: true, 'command.comment': queryId }
    // A command's name must be its first key.
    const { inprog } = await admin.command({ currentOp: 1, ...ownOperation })
    await Promise.all(
      (inprog as Document[]).map(({ opid }) =>
        admin.command({ killOp: 1, op: opid })
      )
    )
  }
  const options = {
    ...(queryId && { comment: queryId }),
    ...(session && { session }),
  }

  const start = performance.now()
  const result: ResultSet[] = []
  for (const call of calls) {
    const context = {
      args: call.args.map((arg) => evaluate(text, arg)),
      options,
      read: chained(call, text, maxRows),
      rows: (docs: Document[]) => rowsOf(docs, maxRows),
    }
    // Statements run in order, as the shell runs them.
    // oxlint-disable-next-line no-await-in-loop
    const set = await cancellable({ cancel, connectionString, queryId }, () =>
      runCall(client, call, context)
    )
    result.push(set)
  }
  return { duration: performance.now() - start, result }
}

import { noop } from '@tamery/shared/utils'
import { type } from 'arktype'

import { readConnectionString } from '../../../parse-connection-string'
import { D1_HOST } from '../../../sqlite-location'
import type {
  SqliteLocationQueries,
  SqliteValue,
  StatementResult,
} from './location'
import { toOutput } from './run'

const d1Answer = type({
  errors: type({ message: 'string' }).array(),
  'result?': type({
    meta: { changes: 'number' },
    results: { columns: 'string[]', rows: 'unknown[][]' },
  })
    .array()
    .or('null'),
  success: 'boolean',
})

/** D1 ends a SQL error with its result code, which a file's error never carries. */
const SQLITE_CODE_SUFFIX = /: SQLITE_\w+(?: \(extended: \w+\))?$/u

interface D1Statement {
  params: unknown[]
  sql: string
}

/** JSON carries neither a 64-bit integer nor bytes. */
const toParam = (value: SqliteValue) => {
  if (typeof value === 'bigint') {
    return String(value)
  }
  return value instanceof Uint8Array ? [...value] : value
}

const toStatements = (texts: string[], values: SqliteValue[]) => {
  const params = values.map(toParam)
  return texts.map((sql): D1Statement => ({ params, sql }))
}

/** One statement goes alone; several go as a batch, which D1 runs in one transaction. */
const send = async (
  connectionString: string,
  statements: D1Statement[]
): Promise<StatementResult[]> => {
  const [only, ...rest] = statements
  if (!only) {
    return []
  }
  const { database, password, user } = readConnectionString(connectionString)
  const response = await fetch(
    `https://${D1_HOST}/client/v4/accounts/${encodeURIComponent(user)}/d1/database/${encodeURIComponent(database)}/raw`,
    {
      body: JSON.stringify(rest.length === 0 ? only : { batch: statements }),
      headers: {
        Authorization: `Bearer ${password}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }
  )
  const answer = d1Answer(await response.json().catch(() => null))
  if (answer instanceof type.errors || !answer.success || !answer.result) {
    const messages =
      answer instanceof type.errors
        ? []
        : answer.errors.map(({ message }) =>
            message.replace(SQLITE_CODE_SUFFIX, '')
          )
    throw new Error(
      messages.join('\n') || `Cloudflare answered ${response.status}`
    )
  }
  return answer.result.map(({ meta, results }) => ({
    changes: meta.changes,
    columns: results.columns,
    rows: results.rows.map((row) => row.map(toOutput)),
  }))
}

/** D1 keeps no transaction open between requests, so a read-only one sends each statement at once. */
const readOnlyTransaction = (connectionString: string) => ({
  commit: noop,
  release: noop,
  rollback: noop,
  run: (texts: string[], values: SqliteValue[]) =>
    send(connectionString, toStatements(texts, values)),
})

/** A write transaction collects its statements and sends them as one batch on commit; they answer with nothing until then. */
const batchedTransaction = (connectionString: string) => {
  let pending: D1Statement[] = []
  return {
    commit: async () => {
      await send(connectionString, pending)
    },
    release: noop,
    rollback: () => {
      pending = []
    },
    run: (texts: string[], values: SqliteValue[]) => {
      pending = [...pending, ...toStatements(texts, values)]
      return Promise.resolve(
        texts.map(() => ({ changes: null, columns: [], rows: [] }))
      )
    },
  }
}

export const d1Location = {
  run: (connectionString, texts, values) =>
    send(connectionString, toStatements(texts, values)),

  transaction: (connectionString, readOnly) =>
    Promise.resolve(
      readOnly
        ? readOnlyTransaction(connectionString)
        : batchedTransaction(connectionString)
    ),
} satisfies SqliteLocationQueries

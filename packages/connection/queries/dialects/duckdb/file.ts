import type {
  DuckDBConnection,
  DuckDBExtractedStatements,
  DuckDBValue,
} from '@duckdb/node-api'
import { ResultReturnType } from '@duckdb/node-api'

import { cancellable } from '../../cancellation'
import { openFile } from './client'
import type { DuckdbTransaction, DuckdbTransport, RunStatements } from './run'
import { readRows } from './run'

const runPrepared = async (
  statements: DuckDBExtractedStatements,
  index: number,
  values: DuckDBValue[],
  maxRows: number
) => {
  const prepared = await statements.prepare(index)
  if (values.length > 0) {
    prepared.bind(values)
  }
  const reader = await prepared.streamAndReadUntil(maxRows + 1)
  return reader.returnType === ResultReturnType.QUERY_RESULT
    ? readRows(reader, maxRows)
    : { affectedRows: reader.rowsChanged, columns: [], rows: [] }
}

const runOn =
  (connectionString: string, connection: DuckDBConnection): RunStatements =>
  (sql, values, { maxRows = Infinity, queryId }) =>
    cancellable(
      {
        cancel: () => Promise.resolve(connection.interrupt()),
        connectionString,
        queryId,
      },
      async () => {
        const statements = await connection.extractStatements(sql)
        const results = []
        for (let index = 0; index < statements.count; index += 1) {
          results.push(
            // oxlint-disable-next-line no-await-in-loop -- a statement is prepared only once the one before it ran, since it can name what that one creates.
            await runPrepared(statements, index, values, maxRows)
          )
        }
        return results
      }
    )

const connect = async (connectionString: string) => {
  const instance = await openFile(connectionString)
  const connection = await instance.connect()
  return {
    connection,
    [Symbol.dispose]: () => {
      connection.closeSync()
      instance.closeSync()
    },
  }
}

const transactionId = async (connection: DuckDBConnection) => {
  const reader = await connection.runAndReadAll('SELECT txid_current()')
  return reader.getRowsJson()[0]?.[0]
}

const sessionOn = async (
  connectionString: string,
  opener: string | null
): Promise<DuckdbTransaction> => {
  const handle = await connect(connectionString)
  const { connection } = handle
  if (opener) {
    await connection.run(opener)
  }
  return {
    commit: async () => {
      await connection.run('COMMIT')
    },
    release: () => handle[Symbol.dispose](),
    rollback: async () => {
      await connection.run('ROLLBACK')
    },
    run: runOn(connectionString, connection),
    // An open transaction keeps its id; outside one every statement gets a new one.
    status: async () => {
      const first = await transactionId(connection)
      return first === (await transactionId(connection)) ? 'open' : 'ended'
    },
  }
}

export const fileTransport = {
  openSession: (connectionString) => sessionOn(connectionString, null),

  run: async (connectionString, ...args) => {
    using handle = await connect(connectionString)
    return await runOn(connectionString, handle.connection)(...args)
  },

  transaction: (connectionString, readOnly) =>
    sessionOn(
      connectionString,
      readOnly ? 'BEGIN TRANSACTION READ ONLY' : 'BEGIN TRANSACTION'
    ),
} satisfies DuckdbTransport

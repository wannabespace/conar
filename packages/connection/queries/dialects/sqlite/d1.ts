import { noop } from '@tamery/shared/utils'
import { type } from 'arktype'

import type { QueryExecuteResult, RunOptions } from '../..'
import { handleQueryError, resultSet } from '../..'
import { readConnectionString } from '../../../parse-connection-string'
import { D1_HOST } from '../../../sqlite-remote'
import { registerTransaction } from '../../transactions'
import type { LocationQueries } from './location'
import { NO_OPEN_SESSION } from './location'
import { statementTexts } from './run'

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

interface D1Statement {
  params: unknown[]
  sql: string
}

const toParam = (value: unknown) => {
  if (typeof value === 'boolean') {
    return Number(value)
  }
  if (typeof value === 'bigint') {
    return String(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value instanceof Uint8Array) {
    return [...value]
  }
  return value ?? null
}

const toStatements = (sql: string, values: unknown[]): D1Statement[] =>
  statementTexts(sql, values).map((text) => ({
    params: values.map(toParam),
    sql: text,
  }))

/** One statement goes alone; several go as a batch, which D1 runs in one transaction. */
const send = async (connectionString: string, statements: D1Statement[]) => {
  const { database, password, user } = readConnectionString(connectionString)
  const [only] = statements
  const response = await fetch(
    `https://${D1_HOST}/client/v4/accounts/${encodeURIComponent(user)}/d1/database/${encodeURIComponent(database)}/raw`,
    {
      body: JSON.stringify(
        statements.length === 1 && only ? only : { batch: statements }
      ),
      headers: {
        Authorization: `Bearer ${password}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }
  )
  const answer = d1Answer.assert(await response.json())
  if (!answer.success || !answer.result) {
    throw new Error(
      answer.errors.map(({ message }) => message).join('\n') ||
        `Cloudflare answered ${response.status}`
    )
  }
  return answer.result
}

const run = async (
  connectionString: string,
  statements: D1Statement[],
  { maxRows = Infinity }: RunOptions
): Promise<QueryExecuteResult> => {
  const start = performance.now()
  const sets = await send(connectionString, statements)
  return {
    duration: performance.now() - start,
    result: sets.map(({ meta, results }) =>
      resultSet(
        {
          affectedRows: results.columns.length === 0 ? meta.changes : null,
          columns: results.columns,
          rows: results.rows,
        },
        maxRows
      )
    ),
  }
}

/** A read-only transaction runs each statement at once: nothing it does needs undoing. */
const readOnlyHandle = (connectionString: string) => ({
  commit: noop,
  execute: (sql: string, values: unknown[], options: RunOptions) =>
    run(connectionString, toStatements(sql, values), options),
  release: noop,
  rollback: noop,
})

/**
 * D1 keeps no transaction open between requests, so a write transaction collects its statements and sends them as
 * one batch on commit. Its statements answer with nothing until then.
 */
const batchedHandle = (connectionString: string) => {
  let pending: D1Statement[] = []
  return {
    commit: async () => {
      if (pending.length > 0) {
        await send(connectionString, pending)
      }
    },
    execute: (sql: string, values: unknown[]) => {
      const statements = toStatements(sql, values)
      pending = [...pending, ...statements]
      return Promise.resolve({
        duration: 0,
        result: statements.map(() =>
          resultSet({ affectedRows: null, columns: [], rows: [] }, Infinity)
        ),
      })
    },
    release: noop,
    rollback: () => {
      pending = []
    },
  }
}

export const d1Query = {
  beginTransaction: handleQueryError(
    ({ accessMode, connectionString, ownerId }) =>
      Promise.resolve({
        txId: registerTransaction(
          accessMode === 'read only'
            ? readOnlyHandle(connectionString)
            : batchedHandle(connectionString),
          ownerId
        ),
      })
  ),

  // A request over HTTP cannot be called back once sent.
  cancel: () => Promise.resolve(),

  execute: handleQueryError(
    ({ connectionString, query: sql, values = [], ...options }) =>
      run(connectionString, toStatements(sql, values), options)
  ),

  openSession: () => Promise.reject(new Error(NO_OPEN_SESSION)),
} satisfies LocationQueries

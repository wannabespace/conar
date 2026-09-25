import { createRequire } from 'node:module'

import { memoize } from 'memoza'
import type * as mssqlModule from 'mssql'

import type { QueryExecutor, RunOptions } from '..'
import { handleQueryError, resultSet } from '..'
import { parseConnectionString } from '../..'
import { parseSSLConfig } from '../../ssl/mssql'
import { cancellable, cancellationQueries } from '../cancellation'
import { registerTransaction, transactionQueries } from '../transactions'

const mssql = createRequire(import.meta.url)('mssql') as typeof mssqlModule

const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const options = parseSSLConfig(searchParams)

  return new mssql.ConnectionPool({
    database: config.database,
    options,
    password: config.password,
    pool: {
      max: 1,
    },
    port: config.port,
    server: config.host,
    user: config.user,
  }).connect()
})

const runRequest = async (
  request: mssqlModule.Request,
  {
    connectionString,
    sql,
    values,
  }: { connectionString: string; sql: string; values: unknown[] },
  { maxRows, queryId }: RunOptions
) => {
  for (const [index, value] of values.entries()) {
    request.input(`${index + 1}`, value)
  }
  request.arrayRowMode = true
  const start = performance.now()
  const result = await cancellable(
    {
      cancel: () => Promise.resolve(request.cancel()),
      connectionString,
      queryId,
    },
    () => request.query<unknown[][]>(sql)
  )
  // Array row mode puts each recordset's columns on `result.columns`, which the typings lack.
  const columnSets: unknown[] =
    'columns' in result && Array.isArray(result.columns) ? result.columns : []
  const sets = result.recordsets.map((rows, index) => {
    const columns = columnSets[index]
    return resultSet(
      {
        affectedRows: null,
        columns: Array.isArray(columns)
          ? columns.map((column: { name: string }) => column.name)
          : [],
        rows,
      },
      maxRows
    )
  })
  return {
    duration: performance.now() - start,
    result:
      sets.length > 0
        ? sets
        : [
            resultSet(
              {
                affectedRows: result.rowsAffected.reduce(
                  (sum, n) => sum + n,
                  0
                ),
                columns: [],
                rows: [],
              },
              maxRows
            ),
          ],
  }
}

export const query = {
  ...transactionQueries,
  ...cancellationQueries,

  beginTransaction: handleQueryError(
    async ({
      connectionString,
      ownerId,
    }: {
      connectionString: string
      ownerId?: string
    }) => {
      const pool = await getPool(connectionString)
      const transaction = pool.transaction()

      await transaction.begin()

      const txId = registerTransaction(
        {
          commit: async () => {
            await transaction.commit()
          },
          execute: (sql, values, options) =>
            runRequest(
              transaction.request(),
              { connectionString, sql, values },
              options
            ),
          release: async () => {
            // mssql's `Transaction` releases its connection internally on commit/rollback.
          },
          rollback: async () => {
            await transaction.rollback()
          },
        },
        ownerId
      )

      return { txId }
    }
  ),

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const pool = await getPool(connectionString)
      return runRequest(
        pool.request(),
        { connectionString, sql, values },
        options
      )
    }
  ),
} satisfies QueryExecutor

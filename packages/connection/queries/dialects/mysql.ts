import { createRequire } from 'node:module'

import { tries } from '@tamery/shared/tries'
import { memoize } from 'memoza'
import type { PoolOptions } from 'mysql2'
import type * as mysql2Promise from 'mysql2/promise'

import type { QueryExecutor, RunOptions, TransactionSettings } from '..'
import { handleQueryError, resultSet } from '..'
import { parseConnectionString } from '../..'
import { readSSLFiles } from '../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../ssl/mysql'
import { cancellable, cancellationQueries } from '../cancellation'
import { registerTransaction, transactionQueries } from '../transactions'

const mysql2 = createRequire(import.meta.url)(
  'mysql2/promise'
) as typeof mysql2Promise

const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf: PoolOptions = {
    ...config,
    connectionLimit: 1,
    dateStrings: true,
    ...(ssl ? { ssl: readSSLFiles(ssl) } : {}),
  }
  const hasSsl = conf.ssl !== undefined

  return tries(
    async () => {
      const pool = mysql2.createPool(conf)
      await pool.query('SELECT 1')
      return { conf, pool }
    },
    !hasSsl &&
      (async ({ previousError }) => {
        const fallback = { ...conf, ssl: defaultSSLConfig }
        const pool = mysql2.createPool(fallback)
        await pool.query('SELECT 1').catch(() => {
          throw previousError
        })
        return { conf: fallback, pool }
      })
  )
})

/** The pool holds one connection and it is busy, so `KILL QUERY` needs its own. */
const killQuery = async (conf: PoolOptions, threadId: number) => {
  const killer = await mysql2.createConnection(conf)
  try {
    await killer.query('KILL QUERY ?', [threadId])
  } finally {
    await killer.end()
  }
}

const affectedRowsOf = (header: unknown) =>
  typeof header === 'object' &&
  header !== null &&
  'affectedRows' in header &&
  typeof header.affectedRows === 'number'
    ? header.affectedRows
    : null

const setOf = (rows: unknown, fields: unknown, maxRows?: number) =>
  resultSet(
    Array.isArray(rows) && Array.isArray(fields)
      ? {
          affectedRows: null,
          columns: fields.map((field: mysql2Promise.FieldPacket) => field.name),
          rows,
        }
      : { affectedRows: affectedRowsOf(rows), columns: [], rows: [] },
    maxRows
  )

const runOn = async (
  connection: mysql2Promise.PoolConnection,
  {
    conf,
    connectionString,
    sql,
    values,
  }: {
    conf: PoolOptions
    connectionString: string
    sql: string
    values: unknown[]
  },
  { maxRows, queryId }: RunOptions
) => {
  const start = performance.now()
  const [rows, fields] = await cancellable(
    {
      cancel: () => killQuery(conf, connection.threadId),
      connectionString,
      queryId,
    },
    () => connection.query({ rowsAsArray: true, sql }, values)
  )
  const fieldSets: unknown[] = fields ?? []
  // `CALL` answers with one row set per SELECT inside the procedure, then a status header.
  const sets =
    Array.isArray(rows) && Array.isArray(fieldSets[0])
      ? rows.map((item, index) => setOf(item, fieldSets[index], maxRows))
      : [setOf(rows, fields, maxRows)]
  return { duration: performance.now() - start, result: sets }
}

export const query = {
  ...transactionQueries,
  ...cancellationQueries,

  beginTransaction: handleQueryError(
    async ({
      accessMode,
      connectionString,
      ownerId,
    }: {
      connectionString: string
      ownerId?: string
    } & TransactionSettings) => {
      const { conf, pool } = await getPool(connectionString)
      const connection = await pool.getConnection()

      try {
        // `isolationLevel` is ignored: MySQL's START TRANSACTION cannot carry one.
        await connection.query(
          accessMode ? `START TRANSACTION ${accessMode}` : 'START TRANSACTION'
        )
      } catch (error) {
        connection.release()
        throw error
      }

      const txId = registerTransaction(
        {
          commit: async () => {
            await connection.commit()
          },
          execute: (sql, values, options) =>
            runOn(connection, { conf, connectionString, sql, values }, options),
          release: () => {
            connection.release()
            return Promise.resolve()
          },
          rollback: async () => {
            await connection.rollback()
          },
        },
        ownerId
      )

      return { txId }
    }
  ),

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const { conf, pool } = await getPool(connectionString)
      const connection = await pool.getConnection()
      try {
        return await runOn(
          connection,
          { conf, connectionString, sql, values },
          options
        )
      } finally {
        connection.release()
      }
    }
  ),
} satisfies QueryExecutor

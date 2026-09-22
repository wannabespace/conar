import { createRequire } from 'node:module'

import { tries } from '@tamery/shared/tries'
import { memoize } from 'memoza'
import type { PoolOptions } from 'mysql2'
import type * as mysql2Promise from 'mysql2/promise'

import type { QueryExecutor } from '..'
import { handleQueryError } from '..'
import { parseConnectionString } from '../..'
import { readSSLFiles } from '../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../ssl/mysql'
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
      return pool
    },
    !hasSsl &&
      (async ({ previousError }) => {
        const pool = mysql2.createPool({
          ...conf,
          ssl: defaultSSLConfig,
        })
        await pool.query('SELECT 1').catch(() => {
          throw previousError
        })
        return pool
      })
  )
})

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(
    async ({
      connectionString,
      ownerId,
    }: {
      connectionString: string
      ownerId?: string
    }) => {
      const pool = await getPool(connectionString)
      const connection = await pool.getConnection()

      try {
        await connection.beginTransaction()
      } catch (error) {
        connection.release()
        throw error
      }

      const txId = registerTransaction(
        {
          commit: async () => {
            await connection.commit()
          },
          execute: async (sql, values) => {
            const start = performance.now()
            const [rows] = await connection.query(sql, values)
            return {
              duration: performance.now() - start,
              result: rows as unknown,
            }
          },
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
    async ({ connectionString, query: sql, values = [] }) => {
      const pool = await getPool(connectionString)
      const start = performance.now()
      const [result] = await pool.query(sql, values)

      return { duration: performance.now() - start, result: result as unknown }
    }
  ),
} satisfies QueryExecutor

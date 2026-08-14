import { createRequire } from 'node:module'

import { tries } from '@tamery/shared/utils/tries'
import { memoize } from 'memoza'
import type { PoolConfig } from 'pg'
import type * as PgModule from 'pg'

import type { QueryExecutor } from '..'
import { handleQueryError } from '..'
import { parseConnectionString } from '../..'
import { readSSLFiles } from '../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../ssl/pg'
import {
  disposeTransaction,
  getTransaction,
  registerTransaction,
} from '../transactions'

const pg = createRequire(import.meta.url)('pg') as typeof PgModule

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf: PoolConfig = {
    ...config,
    max: 1,
    ...(typeof ssl === 'object' ? { ssl: readSSLFiles(ssl) } : {}),
    ...(typeof ssl === 'boolean' ? { ssl } : {}),
  }
  const hasSsl = conf.ssl !== undefined && conf.ssl !== false

  return tries(
    async () => {
      const pool = new pg.Pool(conf)
      await pool.query('SELECT 1')
      return pool
    },
    !hasSsl &&
      (async ({ previousError }) => {
        const pool = new pg.Pool({
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
  beginTransaction: handleQueryError(
    async ({
      connectionString,
      ownerId,
    }: {
      connectionString: string
      ownerId?: string
    }) => {
      const pool = await getPool(connectionString)
      const client = await pool.connect()

      try {
        await client.query('BEGIN')
      } catch (error) {
        client.release()
        throw error
      }

      const txId = registerTransaction(
        {
          commit: async () => {
            await client.query('COMMIT')
          },
          execute: async (sqlText, values) => {
            const start = performance.now()
            const result = await client.query(sqlText, values)
            return {
              duration: performance.now() - start,
              result: result.rows as unknown,
            }
          },
          release: () => {
            client.release()
            return Promise.resolve()
          },
          rollback: async () => {
            await client.query('ROLLBACK')
          },
        },
        ownerId
      )

      return { txId }
    }
  ),
  commitTransaction: handleQueryError(
    async ({ txId, ownerId }: { txId: string; ownerId?: string }) => {
      const handle = disposeTransaction(txId, ownerId)
      if (!handle) {
        return
      }

      try {
        await handle.commit()
      } finally {
        try {
          await handle.release()
        } catch {
          void 0
        }
      }
    }
  ),
  execute: handleQueryError(
    async ({ connectionString, query: sqlText, values = [] }) => {
      const pool = await getPool(connectionString)
      const start = performance.now()
      const result = await pool.query(sqlText, values)

      return {
        duration: performance.now() - start,
        result: result.rows as unknown,
      }
    }
  ),
  executeTransaction: handleQueryError(
    ({
      txId,
      query: sqlText,
      values,
      ownerId,
    }: {
      txId: string
      query: string
      values: unknown[]
      ownerId?: string
    }) => {
      const handle = getTransaction(txId, ownerId)
      if (!handle) {
        throw new Error(`No active transaction found for id: ${txId}`)
      }

      return handle.execute(sqlText, values)
    }
  ),
  rollbackTransaction: handleQueryError(
    async ({ txId, ownerId }: { txId: string; ownerId?: string }) => {
      const handle = disposeTransaction(txId, ownerId)
      if (!handle) {
        return
      }

      try {
        await handle.rollback()
      } finally {
        try {
          await handle.release()
        } catch {
          void 0
        }
      }
    }
  ),
} satisfies QueryExecutor

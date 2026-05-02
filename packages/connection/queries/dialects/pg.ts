import type { PoolConfig } from 'pg'
import type { QueryExecutor } from '..'
import { createRequire } from 'node:module'
import { memoize } from '@conar/memoize'
import { tries } from '@conar/shared/utils/tries'
import { parseConnectionString } from '../..'
import { readSSLFiles } from '../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../ssl/pg'
import { disposeTransaction, getTransaction, registerTransaction } from '../transactions'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

export const getPool = memoize(async (connectionString: string) => {
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
    !hasSsl && (async ({ previousError }) => {
      const pool = new pg.Pool({
        ...conf,
        ssl: defaultSSLConfig,
      })
      await pool.query('SELECT 1').catch(() => {
        throw previousError
      })
      return pool
    }),
  )
})

export const query = {
  execute: async ({ connectionString, query, values = [] }) => {
    const pool = await getPool(connectionString)
    const start = performance.now()
    const result = await pool.query(query, values)

    return { result: result.rows as unknown, duration: performance.now() - start }
  },

  beginTransaction: async ({ connectionString }: { connectionString: string }) => {
    const pool = await getPool(connectionString)
    const client = await pool.connect()

    try {
      await client.query('BEGIN')
    }
    catch (error) {
      client.release()
      throw error
    }

    const txId = registerTransaction({
      execute: async (query, values) => {
        const start = performance.now()
        const result = await client.query(query, values)
        return { result: result.rows as unknown, duration: performance.now() - start }
      },
      commit: async () => {
        await client.query('COMMIT')
      },
      rollback: async () => {
        await client.query('ROLLBACK')
      },
      release: async () => {
        client.release()
      },
    })

    return { txId }
  },

  executeTransaction: async ({ txId, query, values }: { txId: string, query: string, values: unknown[] }) => {
    const handle = getTransaction(txId)
    if (!handle)
      throw new Error(`No active transaction found for id: ${txId}`)

    return handle.execute(query, values)
  },

  commitTransaction: async ({ txId }: { txId: string }) => {
    const handle = disposeTransaction(txId)
    if (!handle)
      return

    try {
      await handle.commit()
    }
    finally {
      await handle.release().catch(() => {})
    }
  },

  rollbackTransaction: async ({ txId }: { txId: string }) => {
    const handle = disposeTransaction(txId)
    if (!handle)
      return

    try {
      await handle.rollback()
    }
    finally {
      await handle.release().catch(() => {})
    }
  },
} satisfies QueryExecutor

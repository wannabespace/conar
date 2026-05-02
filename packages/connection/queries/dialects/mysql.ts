import type { PoolOptions } from 'mysql2'
import type { QueryExecutor } from '..'
import { createRequire } from 'node:module'
import { memoize } from '@conar/memoize'
import { tries } from '@conar/shared/utils/tries'
import { parseConnectionString } from '../..'
import { readSSLFiles } from '../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../ssl/mysql'
import { disposeTransaction, getTransaction, registerTransaction } from '../transactions'

const mysql2 = createRequire(import.meta.url)('mysql2/promise') as typeof import('mysql2/promise')

export const getPool = memoize(async (connectionString: string) => {
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
    !hasSsl && (async ({ previousError }) => {
      const pool = mysql2.createPool({
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
    const [result] = await pool.query(query, values)

    return { result: result as unknown, duration: performance.now() - start }
  },

  beginTransaction: async ({ connectionString }: { connectionString: string }) => {
    const pool = await getPool(connectionString)
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()
    }
    catch (error) {
      connection.release()
      throw error
    }

    const txId = registerTransaction({
      execute: async (query, values) => {
        const start = performance.now()
        const [rows] = await connection.query(query, values)
        return { result: rows as unknown, duration: performance.now() - start }
      },
      commit: async () => {
        await connection.commit()
      },
      rollback: async () => {
        await connection.rollback()
      },
      release: async () => {
        connection.release()
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

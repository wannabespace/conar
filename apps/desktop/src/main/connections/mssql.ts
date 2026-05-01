import type { QueryExecutor } from '@conar/connection/queries'
import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { parseSSLConfig } from '@conar/connection/ssl/mssql'
import { memoize } from '@conar/memoize'
import { disposeTransaction, getTransaction, registerTransaction } from '../lib/transactions'

const mssql = createRequire(import.meta.url)('mssql') as typeof import('mssql')

export const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const options = parseSSLConfig(searchParams)

  return mssql.connect({
    server: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    options,
    pool: {
      max: 1,
    },
  })
})

export const query = {
  execute: async ({ connectionString, query, values = [] }) => {
    const pool = await getPool(connectionString)
    let request = pool.request()

    for (let i = 0; i < values.length; i++) {
      request = request.input(`${i + 1}`, values[i])
    }

    const start = performance.now()
    const result = await request.query(query)

    return { result: result.recordset as unknown, duration: performance.now() - start }
  },

  beginTransaction: async ({ connectionString }: { connectionString: string }) => {
    const pool = await getPool(connectionString)
    const transaction = pool.transaction()

    await transaction.begin()

    const txId = registerTransaction({
      execute: async (query, values) => {
        let request = transaction.request()
        for (let i = 0; i < values.length; i++) {
          request = request.input(`${i + 1}`, values[i])
        }
        const start = performance.now()
        const result = await request.query(query)
        return { result: result.recordset as unknown, duration: performance.now() - start }
      },
      commit: async () => {
        await transaction.commit()
      },
      rollback: async () => {
        await transaction.rollback()
      },
      release: async () => {
        // mssql's `Transaction` releases its connection internally on commit/rollback.
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

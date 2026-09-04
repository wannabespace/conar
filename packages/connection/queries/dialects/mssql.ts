import { createRequire } from 'node:module'

import { silently } from '@tamery/shared/utils/helpers'
import { memoize } from 'memoza'
import type * as mssqlModule from 'mssql'

import type { QueryExecutor } from '..'
import { handleQueryError } from '..'
import { parseConnectionString } from '../..'
import { parseSSLConfig } from '../../ssl/mssql'
import {
  disposeTransaction,
  getTransaction,
  registerTransaction,
} from '../transactions'

const mssql = createRequire(import.meta.url)('mssql') as typeof mssqlModule

const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const options = parseSSLConfig(searchParams)

  return mssql.connect({
    database: config.database,
    options,
    password: config.password,
    pool: {
      max: 1,
    },
    port: config.port,
    server: config.host,
    user: config.user,
  })
})

export const query = {
  beginTransaction: handleQueryError(
    async ({ connectionString }: { connectionString: string }) => {
      const pool = await getPool(connectionString)
      const transaction = pool.transaction()

      await transaction.begin()

      const txId = registerTransaction({
        commit: async () => {
          await transaction.commit()
        },
        execute: async (sql, values) => {
          let request = transaction.request()
          for (let i = 0; i < values.length; i += 1) {
            request = request.input(`${i + 1}`, values[i])
          }
          const start = performance.now()
          const result = await request.query(sql)
          return {
            duration: performance.now() - start,
            result: result.recordset as unknown,
          }
        },
        release: async () => {
          // mssql's `Transaction` releases its connection internally on commit/rollback.
        },
        rollback: async () => {
          await transaction.rollback()
        },
      })

      return { txId }
    }
  ),

  commitTransaction: handleQueryError(async ({ txId }: { txId: string }) => {
    const handle = disposeTransaction(txId)
    if (!handle) {
      return
    }

    try {
      await handle.commit()
    } finally {
      await silently(() => handle.release())
    }
  }),

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [] }) => {
      const pool = await getPool(connectionString)
      let request = pool.request()

      for (let i = 0; i < values.length; i += 1) {
        request = request.input(`${i + 1}`, values[i])
      }

      const start = performance.now()
      const result = await request.query(sql)

      return {
        duration: performance.now() - start,
        result: result.recordset as unknown,
      }
    }
  ),

  executeTransaction: handleQueryError(
    ({
      txId,
      query: sql,
      values,
    }: {
      txId: string
      query: string
      values: unknown[]
    }) => {
      const handle = getTransaction(txId)
      if (!handle) {
        throw new Error(`No active transaction found for id: ${txId}`)
      }

      return handle.execute(sql, values)
    }
  ),

  rollbackTransaction: handleQueryError(async ({ txId }: { txId: string }) => {
    const handle = disposeTransaction(txId)
    if (!handle) {
      return
    }

    try {
      await handle.rollback()
    } finally {
      await silently(() => handle.release())
    }
  }),
} satisfies QueryExecutor

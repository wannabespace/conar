import type { ConnectionType } from '@conar/shared/enums/connection-type'
import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { tryParseJson } from '@conar/shared/utils/helpers'
import { app, ipcMain } from 'electron'
import { autoUpdater } from '..'
import { getClient as getClickhouseClient } from '../connections/clickhouse'
import { getPool as getMssqlPool } from '../connections/mssql'
import { getPool as getMysqlPool } from '../connections/mysql'
import { getPool as getPgPool } from '../connections/pg'

// if (error instanceof AggregateError) {
//   return Promise.reject(error.errors[0])
// }

// return Promise.reject(error)

const queryMap = {
  postgres: async ({ connectionString, query, values }: { query: string, values: unknown[], connectionString: string }) => {
    const pool = await getPgPool(connectionString)
    const start = performance.now()
    const result = await pool.query(query, values)

    return { result: result.rows as unknown, duration: performance.now() - start }
  },
  mysql: async ({ connectionString, query, values }: { query: string, values: unknown[], connectionString: string }) => {
    const pool = await getMysqlPool(connectionString)
    const start = performance.now()
    const [result] = await pool.query(query, values)

    return { result: result as unknown, duration: performance.now() - start }
  },
  clickhouse: async ({ connectionString, query }: { query: string, connectionString: string }) => {
    try {
      const client = getClickhouseClient(connectionString)
      const isSelect = [
        'SELECT',
        'SHOW',
        'DESCRIBE',
        'EXPLAIN',
        'WITH',
        'CHECK',
      ].some(keyword => query.trim().toUpperCase().startsWith(keyword))

      if (isSelect) {
        const start = performance.now()
        const result = await client.query({ query, format: 'JSONEachRow' }).then(result => result.json())
        return { result, duration: performance.now() - start }
      }

      const start = performance.now()
      await client.exec({ query })

      return { result: [], duration: performance.now() - start }
    }
    catch (error) {
      if (error instanceof Error) {
        const parsed = tryParseJson<Partial<{ message: string, status: string, code: number, request_id: string }>>(error.message)

        if (parsed?.message) {
          throw new Error(parsed.message, { cause: error })
        }
      }
      throw error
    }
  },
  mssql: async ({ connectionString, query, values }: { query: string, values: unknown[], connectionString: string }) => {
    const pool = await getMssqlPool(connectionString)
    let request = pool.request()

    for (let i = 0; i < values.length; i++) {
      request = request.input(`${i + 1}`, values[i])
    }

    const start = performance.now()
    const result = await request.query(query)

    return { result: result.recordset as unknown, duration: performance.now() - start }
  },
// eslint-disable-next-line ts/no-explicit-any
} satisfies Record<ConnectionType, (...args: any[]) => Promise<{
  result: unknown
  duration: number
}>>

const encryption = {
  encrypt: async (arg: Parameters<typeof encrypt>[0]) => encrypt(arg),
  decrypt: async (arg: Parameters<typeof decrypt>[0]) => decrypt(arg),
}

const _app = {
  checkForUpdates: () => {
    return autoUpdater?.checkForUpdates()
  },
  quitAndInstall: () => {
    autoUpdater?.restartAndInstall()
  },
}

const versions = {
  app: async () => app.getVersion(),
}

export const electron = {
  query: queryMap,
  encryption,
  app: _app,
  versions,
}

export function initElectronEvents() {
  for (const [key, events] of Object.entries(electron)) {
    for (const [key2, handler] of Object.entries(events)) {
      ipcMain.handle(`${key}.${key2}`, (_event, arg) => handler(arg))
    }
  }
}

import type { DatabaseType } from '@conar/shared/enums/database-type'
import { createRequire } from 'node:module'
import { decrypt, encrypt } from '@conar/shared/encryption'
import { app, ipcMain } from 'electron'
import { sendToast } from '..'
import { getClient as getClickhouseClient } from '../databases/clickhouse'
import { getPool as getMssqlPool } from '../databases/mssql'
import { getPool as getMysqlPool } from '../databases/mysql'
import { getPool as getPgPool } from '../databases/pg'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

function isConnectionError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('ECONNRESET') || error.message.toLowerCase().includes('connection lost')) {
      return true
    }
  }
  return false
}

const MAX_RECONNECTION_ATTEMPTS = 5

async function retryIfConnectionError<T>(func: () => Promise<T>, attempt: number = 0): Promise<T> {
  try {
    return await func()
  }
  catch (error) {
    if (isConnectionError(error) && attempt < MAX_RECONNECTION_ATTEMPTS) {
      const attemptLabel = `Reconnection attempt ${attempt + 1} of ${MAX_RECONNECTION_ATTEMPTS}`

      sendToast({ message: `Could not connect to the database. ${attemptLabel}.`, type: 'info' })

      if (import.meta.env.DEV) {
        console.warn(`Could not connect to the database. ${attemptLabel}.`)
      }

      await new Promise(resolve => setTimeout(resolve, 3000))
      return retryIfConnectionError(func, attempt + 1)
    }
    if (attempt >= MAX_RECONNECTION_ATTEMPTS) {
      sendToast({ message: 'Could not connect to the database. Please check your network or database server and try again.', type: 'error' })
    }
    throw error
  }
}

interface QueryResult {
  result: unknown
  duration: number
}

const queryMap = {
  postgres: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    const pool = getPgPool(connectionString)
    let start = 0
    const result = await retryIfConnectionError(() => {
      start = performance.now()
      return pool.query(sql, values)
    })

    return { result: result.rows as unknown, duration: performance.now() - start }
  },
  mysql: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    const pool = getMysqlPool(connectionString)
    let start = 0
    const [result] = await retryIfConnectionError(() => {
      start = performance.now()
      return pool.query(sql, values)
    })

    return { result: result as unknown, duration: performance.now() - start! }
  },
  clickhouse: async ({ connectionString, sql }: { sql: string, connectionString: string, insertValues?: unknown[] }) => {
    const client = getClickhouseClient(connectionString)
    const isSelect = [
      'SELECT',
      'SHOW',
      'DESCRIBE',
      'EXPLAIN',
      'WITH',
      'CHECK',
    ].some(keyword => sql.trim().toUpperCase().startsWith(keyword))
    let start = 0

    if (isSelect) {
      const result = await retryIfConnectionError(() => {
        start = performance.now()
        return client.query({ query: sql, format: 'JSONEachRow' }).then(result => result.json())
      })
      return { result, duration: performance.now() - start }
    }

    await retryIfConnectionError(() => {
      start = performance.now()
      return client.exec({ query: sql })
    })

    return { result: [], duration: performance.now() - start }
  },
  mssql: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    const pool = await retryIfConnectionError(() => getMssqlPool(connectionString))
    let start = 0
    let request = pool.request()

    for (let i = 0; i < values.length; i++) {
      request = request.input(`${i + 1}`, values[i])
    }

    const result = await retryIfConnectionError(() => {
      start = performance.now()
      return request.query(sql)
    })

    return { result: result.recordset as unknown, duration: performance.now() - start! }
  },
// eslint-disable-next-line ts/no-explicit-any
} satisfies Record<DatabaseType, (...args: any[]) => Promise<QueryResult>>

const encryption = {
  encrypt: async (arg: Parameters<typeof encrypt>[0]) => encrypt(arg),
  decrypt: async (arg: Parameters<typeof decrypt>[0]) => decrypt(arg),
}

const _app = {
  checkForUpdates: () => {
    return autoUpdater.checkForUpdates()
  },
  quitAndInstall: () => {
    autoUpdater.quitAndInstall()
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

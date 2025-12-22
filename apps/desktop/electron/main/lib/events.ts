import type { DatabaseType } from '@conar/shared/enums/database-type'
import { decrypt, encrypt } from '@conar/shared/encryption'
import { app, ipcMain } from 'electron'
import { autoUpdater, sendToast } from '..'
import { getClient as getClickhouseClient } from '../databases/clickhouse'
import { getPool as getMssqlPool } from '../databases/mssql'
import { getPool as getMysqlPool } from '../databases/mysql'
import { getPool as getPgPool } from '../databases/pg'
import { getDatabase as getSqliteDatabase } from '../databases/sqlite'

function isConnectionError(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.includes('ECONNRESET')
      || error.message.toLowerCase().includes('connection lost')
    ) {
      return true
    }
  }
  return false
}

const MAX_RECONNECTION_ATTEMPTS = 5
const RECONNECTION_DELAY = 3000

async function retryIfConnectionError<T>(func: () => Promise<T>, attempt: number = 0): Promise<T> {
  try {
    const result = await func()
    if (attempt > 0) {
      sendToast({ message: `Database connection successful after reconnection ${attempt} attempt${attempt > 1 ? 's' : ''}.`, type: 'success' })
    }
    return result
  }
  catch (error) {
    if (isConnectionError(error) && attempt < MAX_RECONNECTION_ATTEMPTS) {
      sendToast({
        message: `Could not connect to the database. Reconnection attempt ${attempt + 1}/${MAX_RECONNECTION_ATTEMPTS}.`,
        type: 'info',
      })

      await new Promise(resolve => setTimeout(resolve, RECONNECTION_DELAY))
      return retryIfConnectionError(func, attempt + 1)
    }
    if (attempt >= MAX_RECONNECTION_ATTEMPTS) {
      sendToast({
        message: 'Could not connect to the database. Please check your network or database server and try again.',
        type: 'error',
      })
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
    let start = 0
    const result = await retryIfConnectionError(async () => {
      const pool = await getPgPool(connectionString)
      start = performance.now()
      return pool.query(sql, values)
    })

    return { result: result.rows as unknown, duration: performance.now() - start }
  },
  mysql: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    let start = 0
    const [result] = await retryIfConnectionError(async () => {
      const pool = await getMysqlPool(connectionString)
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
  sqlite: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    const db = getSqliteDatabase(connectionString)
    const start = performance.now()

    const isSelect = sql.trim().toUpperCase().startsWith('SELECT')
      || sql.trim().toUpperCase().startsWith('PRAGMA')

    if (isSelect) {
      const stmt = db.prepare(sql)
      // eslint-disable-next-line ts/no-explicit-any
      const result = values && values.length > 0 ? stmt.all(...(values as any[])) : stmt.all()
      return { result: result as unknown, duration: performance.now() - start }
    }

    const stmt = db.prepare(sql)
    // eslint-disable-next-line ts/no-explicit-any
    const info = values && values.length > 0 ? stmt.run(...(values as any[])) : stmt.run()

    return { result: [{ changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) }], duration: performance.now() - start }
  },
  mssql: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    let start = 0

    const result = await retryIfConnectionError(async () => {
      const pool = await getMssqlPool(connectionString)
      let request = pool.request()

      for (let i = 0; i < values.length; i++) {
        request = request.input(`${i + 1}`, values[i])
      }

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

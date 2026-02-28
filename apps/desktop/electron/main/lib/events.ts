import type { ConnectionType } from '@conar/shared/enums/connection-type'
import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { tryParseJson } from '@conar/shared/utils/helpers'
import { app, ipcMain } from 'electron'
import { autoUpdater, sendToast } from '..'
import { getClient as getClickhouseClient } from '../connections/clickhouse'
import { getPool as getMssqlPool } from '../connections/mssql'
import { getPool as getMysqlPool } from '../connections/mysql'
import { getPool as getPgPool } from '../connections/pg'
import { getDatabase as getSQLiteDatabase } from '../connections/sqlite'

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

async function retryIfConnectionError<T>(func: () => Promise<T>, {
  onRetry,
  onError,
  onSuccess,
  attempt = 0,
}: {
  onRetry?: (props: { attempt: number }) => void
  onError?: (error: unknown) => void
  onSuccess?: (props: { attempt: number }) => void
  attempt?: number
} = {
  attempt: 0,
}): Promise<T> {
  try {
    const result = await func()
    onSuccess?.({ attempt })
    return result
  }
  catch (error) {
    if (isConnectionError(error) && attempt < MAX_RECONNECTION_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, RECONNECTION_DELAY))
      onRetry?.({ attempt: attempt + 1 })
      return retryIfConnectionError(func, {
        attempt: attempt + 1,
        onError,
        onRetry,
        onSuccess,
      })
    }
    onError?.(error)
    throw error
  }
}

function retryOptions({ silent }: { silent?: boolean }) {
  return {
    onSuccess: ({ attempt }) => {
      if (attempt > 0 && !silent) {
        sendToast({ message: `Database connection successful after reconnection ${attempt} attempt${attempt > 1 ? 's' : ''}.`, type: 'success' })
      }
    },
    onRetry({ attempt }) {
      if (!silent) {
        sendToast({ message: `Could not connect to the database. Reconnection attempt ${attempt + 1}/${MAX_RECONNECTION_ATTEMPTS}.`, type: 'info' })
      }
    },
    onError: () => {
      if (!silent) {
        sendToast({ message: 'Could not connect to the database. Please check your network or database server and try again.', type: 'error' })
      }
    },
  } satisfies Parameters<typeof retryIfConnectionError>[1]
}

const queryMap = {
  postgres: async ({ connectionString, sql, values, silent }: { sql: string, values: unknown[], connectionString: string, silent?: boolean }) => {
    let start = 0
    const result = await retryIfConnectionError(async () => {
      const pool = await getPgPool(connectionString)
      start = performance.now()
      return pool.query(sql, values)
    }, retryOptions({ silent }))

    return { result: result.rows as unknown, duration: performance.now() - start }
  },
  mysql: async ({ connectionString, sql, values, silent }: { sql: string, values: unknown[], connectionString: string, silent?: boolean }) => {
    let start = 0
    const [result] = await retryIfConnectionError(async () => {
      const pool = await getMysqlPool(connectionString)
      start = performance.now()
      return pool.query(sql, values)
    }, retryOptions({ silent }))

    return { result: result as unknown, duration: performance.now() - start! }
  },
  clickhouse: async ({ connectionString, sql, silent }: { sql: string, connectionString: string, insertValues?: unknown[], silent?: boolean }) => {
    try {
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
        }, retryOptions({ silent }))
        return { result, duration: performance.now() - start }
      }

      await retryIfConnectionError(() => {
        start = performance.now()
        return client.exec({ query: sql })
      }, retryOptions({ silent }))

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
  mssql: async ({ connectionString, sql, values, silent }: { sql: string, values: unknown[], connectionString: string, silent?: boolean }) => {
    let start = 0

    const result = await retryIfConnectionError(async () => {
      const pool = await getMssqlPool(connectionString)
      let request = pool.request()

      for (let i = 0; i < values.length; i++) {
        request = request.input(`${i + 1}`, values[i])
      }

      start = performance.now()
      return request.query(sql)
    }, retryOptions({ silent }))

    return { result: result.recordset as unknown, duration: performance.now() - start! }
  },
  sqlite: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string, silent?: boolean }) => {
    const start = performance.now()
    const db = getSQLiteDatabase(connectionString)

    const stmt = db.prepare(sql)
    const isSelect = sql.trimStart().toUpperCase().startsWith('SELECT')
      || sql.trimStart().toUpperCase().startsWith('PRAGMA')
      || sql.trimStart().toUpperCase().startsWith('WITH')

    const result = isSelect
      ? stmt.all(...values)
      : [stmt.run(...values)]

    return { result: result as unknown, duration: performance.now() - start }
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

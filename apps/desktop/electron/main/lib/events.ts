import type { DatabaseType } from '@conar/shared/enums/database-type'
import { createRequire } from 'node:module'
import { decrypt, encrypt } from '@conar/shared/encryption'
import { app, ipcMain } from 'electron'
import { getClient as getClickhouseClient } from '../databases/clickhouse'
import { getPool as getMysqlPool } from '../databases/mysql'
import { getPool as getPgPool } from '../databases/pg'
import { getDatabase as getSqliteDatabase } from '../databases/sqlite'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

interface QueryResult {
  result: unknown
  duration: number
}

const queryMap = {
  postgres: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    const pool = getPgPool(connectionString)
    const start = performance.now()
    const result = await pool.query(sql, values)

    return { result: result.rows as unknown, duration: performance.now() - start }
  },
  mysql: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    const pool = getMysqlPool(connectionString)
    const start = performance.now()
    const [result] = await pool.query(sql, values)

    return { result: result as unknown, duration: performance.now() - start }
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
    const start = performance.now()

    if (isSelect) {
      const result = await client.query({ query: sql, format: 'JSONEachRow' }).then(result => result.json())
      return { result, duration: performance.now() - start }
    }

    await client.exec({ query: sql })

    return { result: [], duration: performance.now() - start }
  },
  sqlite: async ({ connectionString, sql, values }: { sql: string, values: unknown[], connectionString: string }) => {
    const db = getSqliteDatabase(connectionString)
    const start = performance.now()

    // Check if it's a SELECT query
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT')
      || sql.trim().toUpperCase().startsWith('PRAGMA')

    if (isSelect) {
      // Note: Prepared statements are created on each call for simplicity
      // Future optimization: implement statement caching for frequently executed queries
      const stmt = db.prepare(sql)
      const result = values && values.length > 0 ? stmt.all(...values) : stmt.all()
      return { result: result as unknown, duration: performance.now() - start }
    }

    // For INSERT, UPDATE, DELETE, etc.
    const stmt = db.prepare(sql)
    const info = values && values.length > 0 ? stmt.run(...values) : stmt.run()

    return { result: [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }], duration: performance.now() - start }
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

import type { DatabaseType } from '@conar/shared/enums/database-type'
import { createRequire } from 'node:module'
import { decrypt, encrypt } from '@conar/shared/encryption'
import { app, ipcMain } from 'electron'
import { getPool as getMysqlPool } from '../databases/mysql'
import { getPool as getPgPool } from '../databases/pg'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

const encryption = {
  encrypt: async (arg: Parameters<typeof encrypt>[0]) => encrypt(arg),
  decrypt: async (arg: Parameters<typeof decrypt>[0]) => decrypt(arg),
}

interface SqlParams {
  sql: string
  values: unknown[]
  connectionString: string
}

const sqlMap = {
  postgres: async ({ connectionString, sql, values }) => {
    const pool = getPgPool(connectionString)
    const start = performance.now()
    const result = await pool.query(sql, values)

    return { result: result.rows as unknown, duration: performance.now() - start }
  },
  mysql: async ({ connectionString, sql, values }) => {
    const pool = getMysqlPool(connectionString)
    const start = performance.now()
    const [result] = await pool.query(sql, values)

    return { result: result as unknown, duration: performance.now() - start }
  },
} satisfies Record<DatabaseType, (param: SqlParams) => Promise<{
  result: unknown
  duration: number
}>>

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
  sql: sqlMap,
  encryption,
  app: _app,
  versions,
}

export function initElectronEvents() {
  for (const [key, events] of Object.entries(electron)) {
    // if (typeof events === 'function') {
    //   ipcMain.handle(key, (_event, arg) => events(arg))
    //   continue
    // }

    for (const [key2, handler] of Object.entries(events)) {
      ipcMain.handle(`${key}.${key2}`, (_event, arg) => handler(arg))
    }
  }
}

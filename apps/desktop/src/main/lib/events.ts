import type { QueryExecutor } from '@conar/connection/queries'
import type { ConnectionType } from '@conar/shared/enums/connection-type'
import { Buffer } from 'node:buffer'
import * as clickhouse from '@conar/connection/queries/dialects/clickhouse'
import * as mssql from '@conar/connection/queries/dialects/mssql'
import * as mysql from '@conar/connection/queries/dialects/mysql'
import * as pg from '@conar/connection/queries/dialects/pg'
import { decrypt, encrypt } from '@conar/shared/utils/crypto-node'
import { app, ipcMain, safeStorage } from 'electron'
import { autoUpdater } from '../main'

const queryMap = {
  postgres: pg.query,
  mysql: mysql.query,
  clickhouse: clickhouse.query,
  mssql: mssql.query,
} satisfies Record<ConnectionType, QueryExecutor>

const encryption = {
  encrypt: async (arg: Parameters<typeof encrypt>[0]) => encrypt(arg),
  decrypt: async (arg: Parameters<typeof decrypt>[0]) => decrypt(arg),
}

const safeStorageIpc = {
  isEncryptionAvailable: async () => safeStorage.isEncryptionAvailable(),
  encryptString: async (plain: string) => safeStorage.encryptString(plain).toString('base64'),
  decryptString: async (b64: string) => safeStorage.decryptString(Buffer.from(b64, 'base64')),
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
  safeStorage: safeStorageIpc,
  app: _app,
  versions,
}

function registerHandlers(prefix: string, value: unknown) {
  if (typeof value === 'function') {
    ipcMain.handle(prefix, (_event, arg) => value(arg))
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      registerHandlers(`${prefix}.${key}`, nested)
    }
  }
}

export function initElectronEvents() {
  for (const [key, value] of Object.entries(electron)) {
    registerHandlers(key, value)
  }
}

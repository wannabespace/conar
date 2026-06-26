import type { QueryExecutor } from '@tamery/connection/queries'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import * as clickhouse from '@tamery/connection/queries/dialects/clickhouse'
import * as mssql from '@tamery/connection/queries/dialects/mssql'
import * as mysql from '@tamery/connection/queries/dialects/mysql'
import * as pg from '@tamery/connection/queries/dialects/pg'
import { decrypt, encrypt } from '@tamery/shared/utils/crypto-node'
import { app, ipcMain } from 'electron'
import { autoUpdater } from '../main'

export const electron = {
  query: {
    postgres: pg.query,
    mysql: mysql.query,
    clickhouse: clickhouse.query,
    mssql: mssql.query,
  } satisfies Record<ConnectionType, QueryExecutor>,
  encryption: {
    encrypt: async (arg: Parameters<typeof encrypt>[0]) => encrypt(arg),
    decrypt: async (arg: Parameters<typeof decrypt>[0]) => decrypt(arg),
  },
  app: {
    checkForUpdates: () => {
      return autoUpdater?.checkForUpdates()
    },
    quitAndInstall: () => {
      autoUpdater?.restartAndInstall()
    },
  },
  versions: {
    app: async () => app.getVersion(),
  },
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

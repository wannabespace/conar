import type { QueryExecutor } from '@conar/connection/queries'
import type { ConnectionType } from '@conar/shared/enums/connection-type'
import * as clickhouse from '@conar/connection/queries/dialects/clickhouse'
import * as mssql from '@conar/connection/queries/dialects/mssql'
import * as mysql from '@conar/connection/queries/dialects/mysql'
import * as pg from '@conar/connection/queries/dialects/pg'
import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { wrapAggregateErrors } from '@conar/shared/utils/helpers'
import { app, ipcMain } from 'electron'
import { autoUpdater } from '../main'

const queryMap = {
  postgres: wrapAggregateErrors(pg.query),
  mysql: wrapAggregateErrors(mysql.query),
  clickhouse: wrapAggregateErrors(clickhouse.query),
  mssql: wrapAggregateErrors(mssql.query),
} satisfies Record<ConnectionType, QueryExecutor>

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

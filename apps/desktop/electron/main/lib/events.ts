import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { AnyFunction } from '@conar/shared/utils/helpers'
import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { app, ipcMain } from 'electron'
import { autoUpdater } from '..'
import * as clickhouse from '../connections/clickhouse'
import * as mssql from '../connections/mssql'
import * as mysql from '../connections/mysql'
import * as pg from '../connections/pg'

function wrapAggregateErrors<T extends Record<string, AnyFunction>>(handlers: T): T {
  const wrapped: Record<string, AnyFunction> = {}

  for (const [key, fn] of Object.entries(handlers)) {
    wrapped[key] = async (arg) => {
      try {
        return await fn(arg)
      }
      catch (error) {
        if (error instanceof AggregateError) {
          throw error.errors[0]
        }
        throw error
      }
    }
  }

  return wrapped as T
}

const queryMap = {
  postgres: wrapAggregateErrors(pg.query),
  mysql: wrapAggregateErrors(mysql.query),
  clickhouse: wrapAggregateErrors(clickhouse.query),
  mssql: wrapAggregateErrors(mssql.query),
} satisfies Record<ConnectionType, unknown>

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

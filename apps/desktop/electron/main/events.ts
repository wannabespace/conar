import type { DatabaseQueryResult } from '@conar/shared/databases'
import type { QueryParams } from '@conar/shared/filters/sql'
import { createRequire } from 'node:module'
import { decrypt, encrypt } from '@conar/shared/encryption'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { app, ipcMain } from 'electron'
import { store } from '.'
import { pgQuery, pgTestConnection } from './pg'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

const encryption = {
  encrypt,
  decrypt,
}

const databases = {
  test: async ({
    type,
    connectionString,
  }: {
    type: DatabaseType
    connectionString: string
  }) => {
    const queryMap = {
      [DatabaseType.Postgres]: pgTestConnection,
    }

    try {
      return await queryMap[type]({ connectionString })
    }
    catch (error) {
      if (error instanceof AggregateError) {
        throw error.errors[0]
      }

      throw error
    }
  },
  query: async ({
    type,
    connectionString,
    sql,
    params,
    method,
  }: QueryParams & { type: DatabaseType }) => {
    const queryMap = {
      [DatabaseType.Postgres]: pgQuery,
    }

    try {
      return await queryMap[type]({ connectionString, sql, params, method }) satisfies DatabaseQueryResult
    }
    catch (error) {
      if (error instanceof AggregateError) {
        throw error.errors[0]
      }

      throw error
    }
  },
}

const _app = {
  checkForUpdates: () => {
    return autoUpdater.checkForUpdates()
  },
  quitAndInstall: () => {
    autoUpdater.quitAndInstall()
  },
  channelUpdates: (type: 'default' | 'beta') => {
    autoUpdater.channel = type === 'default' ? null : 'beta'

    if (type === 'beta') {
      store.set('betaUpdates', true)
    }
    else {
      store.delete('betaUpdates')
    }
  },
}

const versions = {
  app: () => app.getVersion(),
}

export const electron = {
  databases,
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

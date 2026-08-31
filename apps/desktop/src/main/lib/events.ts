import type { QueryExecutor } from '@tamery/connection/queries'
import type {
  MenuPopupRequest,
  MenuPopupResult,
} from '@tamery/shared/context-menu'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { decrypt, encrypt } from '@tamery/shared/utils/crypto-node'
import type { IpcMainInvokeEvent } from 'electron'
import { app, ipcMain, nativeTheme } from 'electron'

import { autoUpdater } from '../main'
import { popupNativeContextMenu } from './context-menu'

const lazyQueryExecutor = (
  load: () => Promise<{ query: QueryExecutor }>
): QueryExecutor => {
  const loadQuery = async () => {
    const dialect = await load()

    return dialect.query
  }

  return {
    beginTransaction: async (args) => {
      const query = await loadQuery()

      return query.beginTransaction(args)
    },
    commitTransaction: async (args) => {
      const query = await loadQuery()

      return query.commitTransaction(args)
    },
    execute: async (args) => {
      const query = await loadQuery()

      return query.execute(args)
    },
    executeTransaction: async (args) => {
      const query = await loadQuery()

      return query.executeTransaction(args)
    },
    rollbackTransaction: async (args) => {
      const query = await loadQuery()

      return query.rollbackTransaction(args)
    },
  }
}

export const electron = {
  app: {
    checkForUpdates: () => autoUpdater?.checkForUpdates(),
    quitAndInstall: () => {
      autoUpdater?.restartAndInstall()
    },
    setNativeTheme: (theme: 'light' | 'dark' | 'system') => {
      nativeTheme.themeSource = theme
    },
  },
  encryption: {
    decrypt: (arg: Parameters<typeof decrypt>[0]) => decrypt(arg),
    encrypt: (arg: Parameters<typeof encrypt>[0]) => encrypt(arg),
  },
  menu: {
    popup: ((arg: MenuPopupRequest, event?: IpcMainInvokeEvent) =>
      popupNativeContextMenu(arg, event)) as (
      arg: MenuPopupRequest
    ) => Promise<MenuPopupResult>,
  },
  query: {
    clickhouse: lazyQueryExecutor(
      () => import('@tamery/connection/queries/dialects/clickhouse')
    ),
    mssql: lazyQueryExecutor(
      () => import('@tamery/connection/queries/dialects/mssql')
    ),
    mysql: lazyQueryExecutor(
      () => import('@tamery/connection/queries/dialects/mysql')
    ),
    postgres: lazyQueryExecutor(
      () => import('@tamery/connection/queries/dialects/pg')
    ),
  } satisfies Record<ConnectionType, QueryExecutor>,
  versions: {
    app: () => app.getVersion(),
  },
}

const registerHandlers = (prefix: string, value: unknown) => {
  if (typeof value === 'function') {
    ipcMain.handle(prefix, (event, arg) => value(arg, event))
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      registerHandlers(`${prefix}.${key}`, nested)
    }
  }
}

export const initElectronEvents = () => {
  for (const [key, value] of Object.entries(electron)) {
    registerHandlers(key, value)
  }
}

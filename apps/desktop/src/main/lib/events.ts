import type { QueryExecutor } from '@tamery/connection/queries'
import { sshForwarding } from '@tamery/connection/ssh/forwarding'
import { tunnelForwarding } from '@tamery/connection/ssh/tunnel'
import type {
  MenuPopupRequest,
  MenuPopupResult,
} from '@tamery/shared/context-menu'
import type { Dialect } from '@tamery/shared/enums/connection-type'
import type { IpcMainInvokeEvent } from 'electron'
import { app, ipcMain, nativeTheme } from 'electron'

import { popupNativeContextMenu } from './context-menu'
import { connectionLinks } from './deep-link'
import { deviceEncryption } from './device-encryption'
import { mcp } from './mcp'
import { notifyUnfocused } from './notify'
import { confirmHostKey } from './ssh-host-key'
import { pickSshKeyFile } from './ssh-key-file'
import { autoUpdater } from './todesktop'

// Stays lazy so the native keyring addon and the finders' parsers don't load at startup.
const loadLocalDatabases = () => import('./local-databases/find')

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
    cancel: async (args) => {
      const query = await loadQuery()

      return query.cancel(args)
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
    relaunch: () => {
      app.relaunch()
      app.exit(0)
    },
    setNativeTheme: (theme: 'light' | 'dark' | 'system') => {
      nativeTheme.themeSource = theme
    },
  },
  connectionLinks,
  deviceEncryption,
  localDatabases: {
    find: async () => {
      const { localDatabases } = await loadLocalDatabases()

      return localDatabases.find()
    },
    unlock: async (connectionString: string) => {
      const { localDatabases } = await loadLocalDatabases()

      return localDatabases.unlock(connectionString)
    },
  },
  mcp,
  menu: {
    popup: ((arg: MenuPopupRequest, event?: IpcMainInvokeEvent) =>
      popupNativeContextMenu(arg, event)) as (
      arg: MenuPopupRequest
    ) => Promise<MenuPopupResult>,
  },
  notifications: {
    notify: notifyUnfocused,
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
  } satisfies Record<Dialect, QueryExecutor>,
  ssh: {
    pickKeyFile: pickSshKeyFile,
  },
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
  sshForwarding.use((connectionString) =>
    tunnelForwarding(connectionString, confirmHostKey)
  )
  for (const [key, value] of Object.entries(electron)) {
    registerHandlers(key, value)
  }
}

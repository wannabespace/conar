import type { QueryExecutor } from '@tamery/connection/queries'
import * as clickhouse from '@tamery/connection/queries/dialects/clickhouse'
import * as mssql from '@tamery/connection/queries/dialects/mssql'
import * as mysql from '@tamery/connection/queries/dialects/mysql'
import * as pg from '@tamery/connection/queries/dialects/pg'
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
    clickhouse: clickhouse.query,
    mssql: mssql.query,
    mysql: mysql.query,
    postgres: pg.query,
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

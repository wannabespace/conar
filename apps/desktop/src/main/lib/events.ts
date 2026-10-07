import type {
  MenuPopupRequest,
  MenuPopupResult,
} from '@tamery/shared/context-menu'
import { decrypt, encrypt } from '@tamery/shared/crypto-node'
import type { IpcMainInvokeEvent } from 'electron'
import { app, ipcMain, nativeTheme } from 'electron'

import { popupNativeContextMenu } from './context-menu'
import { mcp } from './mcp'
import { queryExecutors } from './query'
import { autoUpdater } from './todesktop'

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
  mcp,
  menu: {
    popup: ((arg: MenuPopupRequest, event?: IpcMainInvokeEvent) =>
      popupNativeContextMenu(arg, event)) as (
      arg: MenuPopupRequest
    ) => Promise<MenuPopupResult>,
  },
  query: queryExecutors,
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

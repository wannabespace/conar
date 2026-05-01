import type { AnyFunction } from '@conar/shared/utils/helpers'
import type { UpdatesStatus } from '@conar/shared/utils/updates'
import type { electron } from '../main/lib/events'
import type { sendToast } from '../main/main'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { contextBridge, ipcRenderer } from 'electron'

export type ElectronPreload = typeof electron & {
  app: {
    onDeepLink: (callback: (url: string) => void) => () => void
    onUpdatesStatus: (callback: (params: { status: UpdatesStatus, message?: string }) => void) => () => void
    onSendToast: (callback: (params: Parameters<typeof sendToast>[0]) => void) => () => void
  }
  versions: {
    node: () => string
    chrome: () => string
    electron: () => string
  }
}

async function handleError(func: AnyFunction) {
  try {
    const result = await func()

    return result
  }
  catch (error) {
    if (error instanceof Error) {
      // eslint-disable-next-line e18e/prefer-static-regex
      const message = error.message.replace(/^Error invoking remote method '[^']+': /, '')
      const errorMessage = message.toLowerCase().startsWith('error: ') ? message.slice(7) : message

      throw new Error(uppercaseFirst(errorMessage), { cause: error })
    }
    throw error
  }
}

function dialectQueryBridge(dialect: string) {
  return {
    execute: (arg: unknown) => handleError(() => ipcRenderer.invoke(`query.${dialect}.execute`, arg)),
    beginTransaction: (arg: unknown) => handleError(() => ipcRenderer.invoke(`query.${dialect}.beginTransaction`, arg)),
    executeTransaction: (arg: unknown) => handleError(() => ipcRenderer.invoke(`query.${dialect}.executeTransaction`, arg)),
    commitTransaction: (arg: unknown) => handleError(() => ipcRenderer.invoke(`query.${dialect}.commitTransaction`, arg)),
    rollbackTransaction: (arg: unknown) => handleError(() => ipcRenderer.invoke(`query.${dialect}.rollbackTransaction`, arg)),
  }
}

contextBridge.exposeInMainWorld('electron', {
  query: {
    postgres: dialectQueryBridge('postgres'),
    mysql: dialectQueryBridge('mysql'),
    clickhouse: dialectQueryBridge('clickhouse'),
    mssql: dialectQueryBridge('mssql'),
  },
  encryption: {
    encrypt: arg => handleError(() => ipcRenderer.invoke('encryption.encrypt', arg)),
    decrypt: arg => handleError(() => ipcRenderer.invoke('encryption.decrypt', arg)),
  },
  app: {
    onDeepLink: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, url: string) => callback(url)
      ipcRenderer.on('deep-link', listener)
      return () => ipcRenderer.off('deep-link', listener)
    },
    onUpdatesStatus: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, { status, message }: { status: UpdatesStatus, message?: string }) => callback({ status, message })
      ipcRenderer.on('updates-status', listener)
      return () => ipcRenderer.off('updates-status', listener)
    },
    onSendToast: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, params: Parameters<typeof sendToast>[0]) => callback(params)
      ipcRenderer.on('toast', listener)
      return () => ipcRenderer.off('toast', listener)
    },
    checkForUpdates: () => handleError(() => ipcRenderer.invoke('app.checkForUpdates')),
    quitAndInstall: () => handleError(() => ipcRenderer.invoke('app.quitAndInstall')),
  },
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    app: () => ipcRenderer.invoke('versions.app'),
  },
} satisfies ElectronPreload)

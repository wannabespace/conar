import type { AnyFunction } from '@tamery/shared/utils/helpers'
import type { UpdatesStatus } from '@tamery/shared/utils/updates'
import type { electron } from '../main/lib/events'
import type { sendToast } from '../main/main'
import { replaceErrorPrefix } from '@tamery/connection/queries'
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

function handleElectronError<T extends AnyFunction>(fn: T): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    }
    catch (error) {
      if (error instanceof Error) {
        const message = replaceErrorPrefix(error.message.replace(/^Error invoking remote method '[^']+': /, ''))

        throw new Error(message, { cause: error })
      }
      throw error
    }
  }
}

function onEvent<T>(channel: string, callback: (params: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, params: T) => callback(params)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.off(channel, listener)
}

function dialectQueryBridge(dialect: string) {
  return {
    execute: handleElectronError((arg: unknown) => ipcRenderer.invoke(`query.${dialect}.execute`, arg)),
    beginTransaction: handleElectronError((arg: unknown) => ipcRenderer.invoke(`query.${dialect}.beginTransaction`, arg)),
    executeTransaction: handleElectronError((arg: unknown) => ipcRenderer.invoke(`query.${dialect}.executeTransaction`, arg)),
    commitTransaction: handleElectronError((arg: unknown) => ipcRenderer.invoke(`query.${dialect}.commitTransaction`, arg)),
    rollbackTransaction: handleElectronError((arg: unknown) => ipcRenderer.invoke(`query.${dialect}.rollbackTransaction`, arg)),
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
    encrypt: handleElectronError((arg: unknown) => ipcRenderer.invoke('encryption.encrypt', arg)),
    decrypt: handleElectronError((arg: unknown) => ipcRenderer.invoke('encryption.decrypt', arg)),
  },
  app: {
    onDeepLink: callback => onEvent('deep-link', callback),
    onUpdatesStatus: callback => onEvent('updates-status', callback),
    onSendToast: callback => onEvent('toast', callback),
    checkForUpdates: handleElectronError(() => ipcRenderer.invoke('app.checkForUpdates')),
    quitAndInstall: handleElectronError(() => ipcRenderer.invoke('app.quitAndInstall')),
  },
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    app: () => ipcRenderer.invoke('versions.app'),
  },
} satisfies ElectronPreload)

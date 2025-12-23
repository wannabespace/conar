import type { sendToast } from '../main'
import type { electron } from '../main/lib/events'
import type { UpdatesStatus } from '~/updates-observer'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { contextBridge, ipcRenderer } from 'electron'

export type ElectronPreload = typeof electron & {
  app: {
    onDeepLink: (callback: (url: string) => void) => () => void
    onUpdatesStatus: (callback: (params: { status: UpdatesStatus, message?: string }) => void) => () => void
    onNavigate: (callback: (path: string) => void) => () => void
    onSendToast: (callback: (params: Parameters<typeof sendToast>[0]) => void) => () => void
  }
  versions: {
    node: () => string
    chrome: () => string
    electron: () => string
  }
}

// eslint-disable-next-line ts/no-explicit-any
async function handleError(func: () => Promise<any>) {
  try {
    const result = await func()

    return result
  }
  catch (error) {
    if (import.meta.env.DEV) {
      console.error(error)
    }
    if (error instanceof Error) {
      const message = error.message.replace(/^Error invoking remote method '[^']+': /, '')
      const errorMessage = message.toLowerCase().startsWith('error: ') ? message.slice(7) : message

      throw new Error(uppercaseFirst(errorMessage), { cause: error })
    }
    throw error
  }
}

contextBridge.exposeInMainWorld('electron', {
  query: {
    postgres: arg => handleError(() => ipcRenderer.invoke('query.postgres', arg)),
    mysql: arg => handleError(() => ipcRenderer.invoke('query.mysql', arg)),
    clickhouse: arg => handleError(() => ipcRenderer.invoke('query.clickhouse', arg)),
    mssql: arg => handleError(() => ipcRenderer.invoke('query.mssql', arg)),
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
    onNavigate: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, path: string) => callback(path)
      ipcRenderer.on('app.navigate', listener)
      return () => ipcRenderer.off('app.navigate', listener)
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

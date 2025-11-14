import type { electron } from '../main/lib/events'
import type { UpdatesStatus } from '~/updates-observer'
import { contextBridge, ipcRenderer } from 'electron'

export type ElectronPreload = typeof electron & {
  app: {
    onDeepLink: (callback: (url: string) => void) => () => void
    onUpdatesStatus: (callback: (params: { status: UpdatesStatus, message?: string }) => void) => () => void
    onNavigate: (callback: (path: string) => void) => () => void
  }
  versions: {
    node: () => string
    chrome: () => string
    electron: () => string
  }
}

// eslint-disable-next-line ts/no-explicit-any
async function handleError(func: () => any) {
  try {
    const result = await func()

    return result
  }
  catch (error) {
    if (error instanceof Error) {
      const message = error.message.replace(/^Error invoking remote method '[^']+': /, '')
      const errorMessage = message.toLowerCase().startsWith('error: ') ? message.slice(7) : message

      throw new TypeError(errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1), { cause: error })
    }
    throw error
  }
}

contextBridge.exposeInMainWorld('electron', {
  sql: arg => handleError(() => ipcRenderer.invoke('sql', arg)),
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

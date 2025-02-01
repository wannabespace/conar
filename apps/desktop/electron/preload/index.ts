import type { electron } from '../main/events'
import { contextBridge, ipcRenderer } from 'electron'

// eslint-disable-next-line ts/no-explicit-any
export type PromisifyElectron<T extends Record<string, any>> = {
  [K in keyof T]: {
    [K2 in keyof T[K]]: (arg: Parameters<T[K][K2]>[0]) => Promise<ReturnType<T[K][K2]>>
  }
}

export type ElectronPreload = PromisifyElectron<typeof electron> & {
  app: {
    onDeepLink: (callback: (url: string) => void) => void
  }
  versions: {
    node: () => string
    chrome: () => string
    electron: () => string
  }
}

contextBridge.exposeInMainWorld('electron', {
  databases: {
    postgresQuery: arg => ipcRenderer.invoke('postgresQuery', arg),
  },
  encryption: {
    encrypt: arg => ipcRenderer.invoke('encrypt', arg),
    decrypt: arg => ipcRenderer.invoke('decrypt', arg),
  },
  store: {
    get: arg => ipcRenderer.invoke('get', arg),
    set: arg => ipcRenderer.invoke('set', arg),
    delete: arg => ipcRenderer.invoke('delete', arg),
  },
  app: {
    onDeepLink: (callback) => {
      ipcRenderer.on('deep-link', (_event, url) => callback(url))
    },
  },
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
} satisfies ElectronPreload)

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

// eslint-disable-next-line ts/no-explicit-any
async function handleError(func: () => any) {
  try {
    return await func()
  }
  catch (error) {
    if (error instanceof Error) {
      const message = error.message.replace(/^Error invoking remote method '[^']+': /, '')
      throw new TypeError(message.toLowerCase().startsWith('error: ') ? message.slice(7) : message)
    }
    throw error
  }
}

contextBridge.exposeInMainWorld('electron', {
  databases: {
    query: arg => handleError(() => ipcRenderer.invoke('query', arg)),
    testConnection: arg => handleError(() => ipcRenderer.invoke('testConnection', arg)),
  },
  encryption: {
    encrypt: arg => handleError(() => ipcRenderer.invoke('encrypt', arg)),
    decrypt: arg => handleError(() => ipcRenderer.invoke('decrypt', arg)),
  },
  store: {
    get: arg => handleError(() => ipcRenderer.invoke('get', arg)),
    set: arg => handleError(() => ipcRenderer.invoke('set', arg)),
    delete: arg => handleError(() => ipcRenderer.invoke('delete', arg)),
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

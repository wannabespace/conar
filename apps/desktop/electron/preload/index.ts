import type { electron } from '../lib/events'
import { contextBridge, ipcRenderer } from 'electron'

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
    relaunch: () => ipcRenderer.invoke('relaunch'),
  },
  // eslint-disable-next-line ts/no-explicit-any
} satisfies { [key in keyof typeof electron]: Record<keyof typeof electron[key], (arg: any) => any> })

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
})

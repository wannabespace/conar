// import type { events } from '../lib/events'
// import { contextBridge, ipcRenderer } from 'electron'

// contextBridge.exposeInMainWorld('electronAPI', {
//   postgresQuery: arg => ipcRenderer.invoke('postgresQuery', arg),
//   prepareSecret: arg => ipcRenderer.invoke('prepareSecret', arg),
//   // eslint-disable-next-line ts/no-explicit-any
// } satisfies Record<keyof typeof events, (arg: any) => any>)

// contextBridge.exposeInMainWorld('versions', {
//   node: () => process.versions.node,
//   chrome: () => process.versions.chrome,
//   electron: () => process.versions.electron,
//   // we can also expose variables, not just functions
// })

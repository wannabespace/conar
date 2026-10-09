import { replaceErrorPrefix } from '@tamery/connection/queries'
import type { McpReply, McpRequest, McpSource } from '@tamery/shared/mcp'
import type { UpdatesStatus } from '@tamery/shared/updates'
import type { AnyFunction } from '@tamery/shared/utils'
import { tryCatchAsync } from '@tamery/shared/utils'
import { contextBridge, ipcRenderer } from 'electron'

import type { electron } from '../main/lib/events'
import type { sendToast } from '../main/main'

type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : Promisified<T[K]>
}

export type ElectronPreload = Promisified<typeof electron> & {
  app: {
    onUpdatesStatus: (
      callback: (params: { status: UpdatesStatus; message?: string }) => void
    ) => () => void
    onSendToast: (
      callback: (params: Parameters<typeof sendToast>[0]) => void
    ) => () => void
    onFullscreenChange: (
      callback: (isFullscreen: boolean) => void
    ) => () => void
    onFocusChange: (callback: (isFocused: boolean) => void) => () => void
    openWindow: (route: string) => Promise<void>
  }
  mcp: {
    serve: (source: McpSource) => () => void
  }
  versions: {
    node: () => string
    chrome: () => string
    electron: () => string
  }
}

const handleElectronError =
  <T extends AnyFunction>(
    fn: T
  ): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>) =>
  async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof Error) {
        const message = replaceErrorPrefix(
          error.message.replace(/^Error invoking remote method '[^']+': /u, '')
        )

        throw new Error(message, { cause: error })
      }
      throw error
    }
  }

const onEvent = <T>(
  channel: string,
  onMessage: (params: T) => void
): (() => void) => {
  const listener = (_event: Electron.IpcRendererEvent, params: T) => {
    onMessage(params)
  }
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.off(channel, listener)
}

let mcpSource: McpSource | null = null

ipcRenderer.on('mcp.request', async (event, request: McpRequest) => {
  const [port] = event.ports
  if (!port) {
    return
  }
  const reply = (message: McpReply) => port.postMessage(message)
  if (!mcpSource) {
    reply({ idle: true })
    return
  }
  // TS cannot correlate `request.method` with `request.args` across the union.
  const method = mcpSource[request.method] as (
    args: McpRequest['args'],
    onAbort: (listener: () => void) => void
  ) => unknown
  const { data, error } = await tryCatchAsync(() =>
    Promise.resolve(
      method(request.args, (listener) => {
        port.addEventListener('message', listener)
        port.start()
      })
    )
  )
  reply(error ? { error: error.message } : { result: data })
})

const dialectQueryBridge = (dialect: string) => ({
  beginTransaction: handleElectronError((arg: unknown) =>
    ipcRenderer.invoke(`query.${dialect}.beginTransaction`, arg)
  ),
  cancel: handleElectronError((arg: unknown) =>
    ipcRenderer.invoke(`query.${dialect}.cancel`, arg)
  ),
  commitTransaction: handleElectronError((arg: unknown) =>
    ipcRenderer.invoke(`query.${dialect}.commitTransaction`, arg)
  ),
  execute: handleElectronError((arg: unknown) =>
    ipcRenderer.invoke(`query.${dialect}.execute`, arg)
  ),
  executeTransaction: handleElectronError((arg: unknown) =>
    ipcRenderer.invoke(`query.${dialect}.executeTransaction`, arg)
  ),
  rollbackTransaction: handleElectronError((arg: unknown) =>
    ipcRenderer.invoke(`query.${dialect}.rollbackTransaction`, arg)
  ),
})

contextBridge.exposeInMainWorld('electron', {
  app: {
    checkForUpdates: handleElectronError(() =>
      ipcRenderer.invoke('app.checkForUpdates')
    ),
    onFocusChange: (onMessage) => onEvent('focus-changed', onMessage),
    onFullscreenChange: (onMessage) => onEvent('fullscreen-changed', onMessage),
    onSendToast: (onMessage) => onEvent('toast', onMessage),
    onUpdatesStatus: (onMessage) => onEvent('updates-status', onMessage),
    openWindow: handleElectronError((route: string) =>
      ipcRenderer.invoke('app.openWindow', route)
    ),
    quitAndInstall: handleElectronError(() =>
      ipcRenderer.invoke('app.quitAndInstall')
    ),
    setNativeTheme: handleElectronError((arg: unknown) =>
      ipcRenderer.invoke('app.setNativeTheme', arg)
    ),
  },
  encryption: {
    decrypt: handleElectronError((arg: unknown) =>
      ipcRenderer.invoke('encryption.decrypt', arg)
    ),
    encrypt: handleElectronError((arg: unknown) =>
      ipcRenderer.invoke('encryption.encrypt', arg)
    ),
  },
  mcp: {
    clients: handleElectronError(() => ipcRenderer.invoke('mcp.clients')),
    connectionAccess: handleElectronError(() =>
      ipcRenderer.invoke('mcp.connectionAccess')
    ),
    regenerateToken: handleElectronError(() =>
      ipcRenderer.invoke('mcp.regenerateToken')
    ),
    serve: (source) => {
      mcpSource = source
      return () => {
        mcpSource = null
      }
    },
    setAccess: handleElectronError((arg: unknown) =>
      ipcRenderer.invoke('mcp.setAccess', arg)
    ),
    setEnabled: handleElectronError((arg: unknown) =>
      ipcRenderer.invoke('mcp.setEnabled', arg)
    ),
    status: handleElectronError(() => ipcRenderer.invoke('mcp.status')),
  },
  menu: {
    popup: handleElectronError((arg: unknown) =>
      ipcRenderer.invoke('menu.popup', arg)
    ),
  },
  notifications: {
    notify: handleElectronError((arg: unknown) =>
      ipcRenderer.invoke('notifications.notify', arg)
    ),
  },
  query: {
    clickhouse: dialectQueryBridge('clickhouse'),
    mssql: dialectQueryBridge('mssql'),
    mysql: dialectQueryBridge('mysql'),
    postgres: dialectQueryBridge('postgres'),
  },
  versions: {
    app: () => ipcRenderer.invoke('versions.app'),
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    node: () => process.versions.node,
  },
} satisfies ElectronPreload)

import { replaceErrorPrefix } from '@tamery/connection/queries'
import type { AnyFunction } from '@tamery/shared/utils/helpers'
import type { UpdatesStatus } from '@tamery/shared/utils/updates'
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
    onDeepLink: (callback: (url: string) => void) => () => void
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

const dialectQueryBridge = (dialect: string) => ({
  beginTransaction: handleElectronError((arg: unknown) =>
    ipcRenderer.invoke(`query.${dialect}.beginTransaction`, arg)
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
    onDeepLink: (onMessage) => onEvent('deep-link', onMessage),
    onFocusChange: (onMessage) => onEvent('focus-changed', onMessage),
    onFullscreenChange: (onMessage) => onEvent('fullscreen-changed', onMessage),
    onSendToast: (onMessage) => onEvent('toast', onMessage),
    onUpdatesStatus: (onMessage) => onEvent('updates-status', onMessage),
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
  menu: {
    popup: handleElectronError((arg: unknown) =>
      ipcRenderer.invoke('menu.popup', arg)
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

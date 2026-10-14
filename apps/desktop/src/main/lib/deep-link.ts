import path from 'node:path'

import { app, BrowserWindow } from 'electron'

import todesktop from '../../../todesktop.json'

const DEEPLINK_PROTOCOL = 'tamery'
const CONNECTION_LINK_SCHEMES = todesktop.appProtocolScheme.filter(
  (scheme) => scheme !== DEEPLINK_PROTOCOL
)
const CONNECTION_LINK = new RegExp(
  `^(?:${CONNECTION_LINK_SCHEMES.join('|')})://`,
  'iu'
)

const [, argvPath] = process.argv
const handlerPath =
  process.defaultApp && argvPath ? process.execPath : undefined
const handlerArgs =
  process.defaultApp && argvPath ? [path.resolve(argvPath)] : undefined

let createWindow: (() => BrowserWindow) | null = null
let pendingConnectionLink =
  process.argv.find((arg) => CONNECTION_LINK.test(arg)) ?? null

export const focusMainWindow = () => {
  const mainWindow = BrowserWindow.getAllWindows()[0] ?? createWindow?.()
  if (!mainWindow) {
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.focus()

  if (process.platform === 'darwin') {
    app.dock?.show()
    mainWindow.setAlwaysOnTop(true)
    mainWindow.show()
    mainWindow.setAlwaysOnTop(false)
  }

  return mainWindow
}

const openUrl = (url: string | undefined) => {
  if (url && CONNECTION_LINK.test(url)) {
    pendingConnectionLink = url
  }
  if (app.isReady()) {
    focusMainWindow()?.webContents.send('url-opened')
  }
}

export const connectionLinks = {
  isDefault: () =>
    CONNECTION_LINK_SCHEMES.every((scheme) =>
      app.isDefaultProtocolClient(scheme, handlerPath, handlerArgs)
    ),
  setDefault: (enabled: boolean) => {
    for (const scheme of CONNECTION_LINK_SCHEMES) {
      if (enabled) {
        app.setAsDefaultProtocolClient(scheme, handlerPath, handlerArgs)
      } else {
        app.removeAsDefaultProtocolClient(scheme, handlerPath, handlerArgs)
      }
    }
    return connectionLinks.isDefault()
  },
  take: () => {
    const link = pendingConnectionLink
    pendingConnectionLink = null
    return link
  },
}

export const setupProtocolHandler = (openWindow: () => BrowserWindow) => {
  createWindow = openWindow

  app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL, handlerPath, handlerArgs)

  const gotTheLock = app.requestSingleInstanceLock()

  if (gotTheLock) {
    app.on('second-instance', (_event, argv) =>
      openUrl(argv.find((arg) => CONNECTION_LINK.test(arg)))
    )
  } else {
    app.quit()
  }
}

// Fires before `ready` on a cold start, so the link waits in `pendingConnectionLink` until the renderer takes it.
app.on('open-url', (event, url) => {
  event.preventDefault()
  openUrl(url)
})

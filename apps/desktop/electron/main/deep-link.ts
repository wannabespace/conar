import type { BrowserWindow } from 'electron'
import path from 'node:path'
import { app } from 'electron'

const DEEPLINK_PROTOCOL = 'connnect'

let deepLinkUrl: string | null = null
let mainWindow: BrowserWindow | null = null

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL, process.execPath, [path.resolve(process.argv[1])])
  }
}
else {
  app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL)
}

function handle(url: string) {
  if (mainWindow === null) {
    deepLinkUrl = url
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.focus()

  // Show the app on macOS
  if (process.platform === 'darwin') {
    app.dock?.show()
    mainWindow.setAlwaysOnTop(true)
    mainWindow.show()
    mainWindow.setAlwaysOnTop(false)
  }

  mainWindow.webContents.send('deep-link', url)
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}
else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized())
        mainWindow.restore()

      mainWindow.focus()

      const deeplinkingUrl = commandLine.pop()

      if (deeplinkingUrl) {
        handle(deeplinkingUrl)
      }
    }
  })
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  handle(url)
})

export function handleDeepLink(w: BrowserWindow) {
  mainWindow = w

  w.webContents.on('did-finish-load', () => {
    if (deepLinkUrl) {
      handle(deepLinkUrl)
      deepLinkUrl = null
    }
  })
}

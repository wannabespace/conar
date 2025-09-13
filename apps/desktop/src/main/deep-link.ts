import type { BrowserWindow } from 'electron'
import path from 'node:path'
import { app } from 'electron'

const DEEPLINK_PROTOCOL = 'conar'

let deepLinkUrl: string | null = null
let mainWindow: BrowserWindow | null = null

export function setupProtocolHandler(win: BrowserWindow) {
  mainWindow = win

  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]!),
    ])
  }
  else {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL)
  }

  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    app.quit()
  }
  else {
    app.on('second-instance', (_event, commandLine) => {
      if (win.isMinimized())
        win.restore()

      win.focus()

      const deeplinkingUrl = commandLine.pop()

      if (deeplinkingUrl) {
        sendDeepLink(deeplinkingUrl)
      }
    })
  }

  win.webContents.on('did-finish-load', () => {
    if (deepLinkUrl) {
      sendDeepLink(deepLinkUrl)
      deepLinkUrl = null
    }
  })
}

function sendDeepLink(url: string) {
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

app.on('open-url', (event, url) => {
  event.preventDefault()
  sendDeepLink(url)
})

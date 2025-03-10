import type { BrowserWindow } from 'electron'
import { app } from 'electron'

const DEEPLINK_PROTOCOL = 'connnect'

let deepLinkUrl: string | null = null
let mainWindow: BrowserWindow | null = null

function handle(url: string) {
  if (mainWindow === null) {
    deepLinkUrl = url
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.focus()

  if (process.platform === 'darwin') {
    app.dock.show()
    mainWindow.setAlwaysOnTop(true)
    mainWindow.show()
    mainWindow.setAlwaysOnTop(false)
  }

  mainWindow.webContents.send('deep-link', url)
}

export function handleDeepLink(w: BrowserWindow) {
  mainWindow = w

  w.webContents.on('did-finish-load', () => {
    if (deepLinkUrl) {
      handle(deepLinkUrl)
      deepLinkUrl = null
    }
  })

  // Handle deep linking for Windows/Linux
  if (process.platform !== 'darwin') {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL)

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

          // On Windows the deep link URL is passed as a command line argument
          const deeplinkingUrl = commandLine.find(arg => arg.startsWith(`${DEEPLINK_PROTOCOL}://`))

          if (deeplinkingUrl) {
            handle(deeplinkingUrl)
          }
        }
      })
    }
  }
  // Handle deep linking for macOS
  else {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL)

    app.on('open-url', (_event, url) => {
      if (url.startsWith(`${DEEPLINK_PROTOCOL}://`)) {
        handle(url)
      }
    })
  }
}

// Handle URLs when app is launched from URL click
app.on('open-url', (event, url) => {
  event.preventDefault()
  handle(url)
})

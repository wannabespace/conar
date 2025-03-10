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

  app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL)

  // Handle deep linking on Windows
  if (process.platform === 'win32') {
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

          // Protocol handler for windows
          const deeplinkingUrl = commandLine.find(arg => arg.startsWith(`${DEEPLINK_PROTOCOL}://`))
          if (deeplinkingUrl) {
            mainWindow.webContents.send('deep-link', deeplinkingUrl)
          }
        }
      })
    }
  }

  // Handle deep linking on Linux
  if (process.platform === 'linux') {
    app.on('open-url', (_event, url) => {
      if (mainWindow && url.startsWith(`${DEEPLINK_PROTOCOL}://`)) {
        mainWindow.webContents.send('deep-link', url)
      }
    })
  }
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  handle(url)
})

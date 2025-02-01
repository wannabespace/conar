import type { BrowserWindow } from 'electron'
import { app } from 'electron'

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
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  handle(url)
})

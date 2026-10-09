import path from 'node:path'

import type { BrowserWindow } from 'electron'
import { app } from 'electron'

const DEEPLINK_PROTOCOL = 'tamery'

let mainWindow: BrowserWindow | null = null

export const focusMainWindow = () => {
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
}

export const setupProtocolHandler = (win: BrowserWindow) => {
  mainWindow = win

  const [, argvPath] = process.argv
  if (process.defaultApp && process.argv.length >= 2 && argvPath) {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL, process.execPath, [
      path.resolve(argvPath),
    ])
  } else {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL)
  }

  const gotTheLock = app.requestSingleInstanceLock()

  if (gotTheLock) {
    app.on('second-instance', focusMainWindow)
  } else {
    app.quit()
  }
}

app.on('open-url', (event) => {
  event.preventDefault()
  focusMainWindow()
})

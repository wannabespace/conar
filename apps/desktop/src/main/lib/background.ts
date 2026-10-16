import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron'

import trayIcon from '../../../resources/tray-icon.png?inline'
import { focusMainWindow } from './deep-link'
import { mcp } from './mcp'
import { autoUpdater } from './todesktop'

let quitting = false
let tray: Tray | null = null

app.on('before-quit', () => {
  quitting = true
})
// `restartAndInstall` closes every window before `before-quit` fires.
autoUpdater?.on('before-quit-for-update', () => {
  quitting = true
})

export const keepsServingAfterClose = () =>
  !quitting &&
  mcp.status().state === 'running' &&
  mcp.keepRunning() &&
  BrowserWindow.getAllWindows().length === 1

const showTray = () => {
  tray = new Tray(nativeImage.createFromDataURL(trayIcon))
  tray.setToolTip('Tamery: MCP server running')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { click: focusMainWindow, label: 'Open Tamery' },
      { click: () => app.quit(), label: 'Quit Tamery' },
    ])
  )
  tray.on('click', focusMainWindow)
}

export const sendToBackground = (win: BrowserWindow) => {
  // Hidden pages throttle chained timers to once a minute, which stalls the renderer's query scheduling and every MCP call with it.
  win.webContents.setBackgroundThrottling(false)
  win.once('show', () => {
    win.webContents.setBackgroundThrottling(true)
    tray?.destroy()
    tray = null
  })
  if (process.platform !== 'darwin') {
    showTray()
  }
  // `hide()` on a fullscreen macOS window leaves a black Space behind.
  if (win.isFullScreen()) {
    win.once('leave-full-screen', () => win.hide())
    win.once('show', () => win.setFullScreen(true))
    win.setFullScreen(false)
  } else {
    win.hide()
  }
}

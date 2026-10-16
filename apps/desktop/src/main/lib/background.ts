/// <reference types="vite/client" />
import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import Store from 'electron-store'

import trayIcon from '../../../resources/tray-icon.png?inline'
import { mcp } from './mcp'
import { autoUpdater } from './todesktop'

const store = new Store<{ keepRunning: boolean }>({
  defaults: { keepRunning: true },
  name: 'background',
})

let quitting = false
let tray: Tray | null = null

app.on('before-quit', () => {
  quitting = true
})
// `restartAndInstall` closes every window before `before-quit` fires.
autoUpdater?.on('before-quit-for-update', () => {
  quitting = true
})

export const keepRunning = {
  get: () => store.get('keepRunning'),
  set: (enabled: boolean) => {
    store.set('keepRunning', enabled)
    return enabled
  },
}

export const keepsServingAfterClose = (win: BrowserWindow) =>
  !quitting &&
  mcp.status().state === 'running' &&
  keepRunning.get() &&
  BrowserWindow.getAllWindows().every(
    (other) => other === win || !other.isVisible()
  )

const showTray = (win: BrowserWindow) => {
  tray = new Tray(nativeImage.createFromDataURL(trayIcon))
  tray.setToolTip('Tamery: MCP server running')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { click: () => win.show(), label: 'Open Tamery' },
      { click: () => app.quit(), label: 'Quit Tamery' },
    ])
  )
  tray.on('click', () => win.show())
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
    showTray(win)
  }
  // `hide()` on a fullscreen macOS window leaves a black Space behind.
  if (win.isFullScreen()) {
    win.once('leave-full-screen', () => win.hide())
    win.setFullScreen(false)
  } else {
    win.hide()
  }
}

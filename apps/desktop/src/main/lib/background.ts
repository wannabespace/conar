import {
  app,
  BrowserWindow,
  Menu,
  nativeImage,
  Notification,
  powerMonitor,
  Tray,
} from 'electron'
import Store from 'electron-store'

import trayIcon from '../../../resources/tray-icon.png?inline'
import { focusMainWindow } from './deep-link'
import { mcp } from './mcp'
import { autoUpdater } from './todesktop'

let quitting = false
let tray: Tray | null = null

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

const store = new Store<{ quitHintShown: boolean }>({
  defaults: { quitHintShown: false },
  name: 'background',
})

const showQuitHint = () => {
  if (store.get('quitHintShown') || !Notification.isSupported()) {
    return
  }
  store.set('quitHintShown', true)
  new Notification({
    body: 'Agents can keep using MCP. Press ⌘Q again or quit from the Dock to stop it.',
    title: 'Tamery is still running',
  }).show()
}

const keepsServingOnQuit = () =>
  process.platform === 'darwin' &&
  !quitting &&
  mcp.status().state === 'running' &&
  mcp.keepRunning() &&
  mcp.clients().length > 0 &&
  BrowserWindow.getAllWindows().some((win) => win.isVisible())

app.on('before-quit', (event) => {
  if (!keepsServingOnQuit()) {
    quitting = true
    return
  }
  event.preventDefault()
  const windows = BrowserWindow.getAllWindows()
  const kept = windows.find((win) => win.isFocused()) ?? windows[0]
  for (const win of windows) {
    if (win !== kept) {
      win.close()
    }
  }
  if (kept) {
    sendToBackground(kept)
    kept.webContents.send('kept-running-on-quit')
  }
  showQuitHint()
})
// Logging out or shutting down quits through `before-quit`, which must not hold the system up.
app.on('ready', () =>
  powerMonitor.on('shutdown', () => {
    quitting = true
  })
)

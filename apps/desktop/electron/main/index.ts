import type { Rectangle } from 'electron'
import type { UpdatesStatus } from '~/updates-observer'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import Store from 'electron-store'
import { setupProtocolHandler } from './deep-link'
import { initElectronEvents } from './events'
import MenuBuilder from './menu'

const store = new Store()

const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

initElectronEvents()

let mainWindow: BrowserWindow | null = null

export function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 500,
    minHeight: 500,
    focusable: true,
    // titleBarStyle: 'default',
    // vibrancy: 'fullscreen-ui', // on MacOS
    // backgroundMaterial: 'acrylic', // on Windows 11
    // visualEffectState: 'active',
    webPreferences: {
      sandbox: false,
      preload: path.join(path.dirname(fileURLToPath(import.meta.url)), '../preload/index.mjs'),
    },
  })

  mainWindow.setBounds(store.get('bounds') as Rectangle)

  const isFullscreen = store.get('fullscreen', false) as boolean
  if (isFullscreen) {
    mainWindow.setFullScreen(true)
  }

  mainWindow.on('close', () => {
    store.set('bounds', mainWindow!.getBounds())
    store.set('fullscreen', mainWindow!.isFullScreen())
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  const menuBuilder = new MenuBuilder(mainWindow)
  menuBuilder.buildMenu()

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.webContents.openDevTools()
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  }
  else {
    mainWindow.loadFile(path.join(path.dirname(fileURLToPath(import.meta.url)), '../renderer/index.html'))
  }

  return mainWindow
}

app.on('ready', () => {
  const win = createWindow()

  win.webContents.setWindowOpenHandler(({ url }) => {
    // TODO: recheck internal router links
    const { protocol } = new URL(url)
    if (protocol === 'http:' || protocol === 'https:') {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  setupProtocolHandler(win)

  setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 10)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function sendUpdatesStatus(status: UpdatesStatus, message?: string) {
  mainWindow!.webContents.send('updates-status', { status, message })
}

autoUpdater.on('checking-for-update', () => {
  sendUpdatesStatus('checking')
})
autoUpdater.on('update-available', () => {
  autoUpdater.downloadUpdate()
  sendUpdatesStatus('downloading')
})
autoUpdater.on('update-not-available', () => {
  sendUpdatesStatus('no-updates')
})
autoUpdater.on('error', (e) => {
  sendUpdatesStatus('error', e.message.split('\n')[0])
})
autoUpdater.on('download-progress', () => {
  sendUpdatesStatus('downloading')
})
autoUpdater.on('update-downloaded', (event) => {
  sendUpdatesStatus('ready', typeof event.releaseNotes === 'string' ? event.releaseNotes : undefined)
})

// Handle manual update check from menu (i am not sure about this one)
ipcMain.on('check-for-updates', () => {
  console.log('Manual update check triggered from menu')
  autoUpdater.checkForUpdates()
})

// Handle navigation from menu
ipcMain.on('navigate-to', (_event, path: string) => {
  console.log('Navigate to:', path)
  if (mainWindow) {
    mainWindow.webContents.send('navigate-to', path)
  }
})

import type { UpdatesStatus } from '~/updates-provider'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, screen, shell } from 'electron'
import { handleDeepLink } from './deep-link'
import { initElectronEvents } from './events'

const started = createRequire(import.meta.url)('electron-squirrel-startup') as typeof import('electron-squirrel-startup')
const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

if (started) {
  app.quit()
}

autoUpdater.autoInstallOnAppQuit = true

initElectronEvents()

let mainWindow: BrowserWindow | null = null

export function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width,
    height,
    focusable: true,
    webPreferences: {
      preload: path.join(path.dirname(fileURLToPath(import.meta.url)), '../preload/index.mjs'),
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // TODO: recheck internal router links
    const { protocol } = new URL(url)
    if (protocol === 'http:' || protocol === 'https:') {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  }
  else {
    mainWindow.loadFile('dist/index.html')
  }

  handleDeepLink(mainWindow)
}

app.on('ready', createWindow)

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
autoUpdater.on('update-downloaded', () => {
  sendUpdatesStatus('ready')
})

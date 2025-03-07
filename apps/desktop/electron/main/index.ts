import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, screen, shell } from 'electron'
import started from 'electron-squirrel-startup/index'
import { autoUpdater } from 'electron-updater'
import { handleDeepLink } from './deep-link'
import { initElectronEvents } from './events'

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
    titleBarStyle: 'hidden',
    trafficLightPosition: {
      x: 12,
      y: 12,
    },
    webPreferences: {
      preload: path.join(path.dirname(fileURLToPath(import.meta.url)), '../preload/index.mjs'),
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const { protocol } = new URL(url)
    if (protocol === 'http:' || protocol === 'https:') {
      shell.openExternal(url)
    }
    return { action: 'deny' }
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => createWindow)

app.setAsDefaultProtocolClient('connnect')

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

function sendUpdatesStatus(status: string) {
  mainWindow!.webContents.send('updates-status', status)
}

autoUpdater.on('checking-for-update', () => {
  sendUpdatesStatus(`Checking for update... ${app.getVersion()}`)
})
autoUpdater.on('update-available', () => {
  sendUpdatesStatus(`Update available. ${app.getVersion()}`)
  autoUpdater.downloadUpdate()
})
autoUpdater.on('update-not-available', () => {
  sendUpdatesStatus(`Update not available. ${app.getVersion()}`)
})
autoUpdater.on('error', (err) => {
  sendUpdatesStatus(`Error in auto-updater. ${err}`)
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond}`
  log_message = `${log_message} - Downloaded ${progressObj.percent}%`
  log_message = `${log_message} (${progressObj.transferred}/${progressObj.total})`
  sendUpdatesStatus(log_message)
})
autoUpdater.on('update-downloaded', () => {
  sendUpdatesStatus(`Update downloaded. ${app.getVersion()}`)
})

import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { isConnectionError } from '@tamery/shared/utils/connections'
import type { UpdatesStatus } from '@tamery/shared/utils/updates'
import type { Rectangle } from 'electron'
import { app, BrowserWindow, screen, shell } from 'electron'
import Store from 'electron-store'

import { setupProtocolHandler } from './lib/deep-link'
import { initElectronEvents } from './lib/events'
import { buildMenu } from './lib/menu'

const todesktop = createRequire(import.meta.url)(
  '@todesktop/runtime',
) as typeof import('@todesktop/runtime')

todesktop.init()

export const { autoUpdater } = todesktop

initElectronEvents()

process.on('uncaughtException', error => {
  if (isConnectionError(error)) {
    console.error('[Suppressed Connection Error]', error.message)
    return
  }
  throw error
})

process.on('unhandledRejection', reason => {
  if (isConnectionError(reason)) {
    console.error(
      '[Suppressed Connection Rejection]',
      reason instanceof Error ? reason.message : reason,
    )
    return
  }
  throw reason
})

export const store = new Store<{
  bounds?: Rectangle
  fullscreen?: boolean
}>()

let mainWindow: BrowserWindow | null = null

export function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 500,
    minHeight: 500,
    focusable: true,
    // Custom topbar: hide the native title bar background on every OS.
    titleBarStyle: 'hidden',
    // macOS: keep native traffic lights, inset into the 40px topbar.
    trafficLightPosition: { x: 16, y: 14 },
    // Windows/Linux: native min/max/close via Window Controls Overlay.
    ...(!isMac && {
      titleBarOverlay: {
        color: '#00000000',
        symbolColor: '#a1a1aa',
        height: 40,
      },
    }),
    webPreferences: {
      sandbox: false,
      preload: path.join(path.dirname(fileURLToPath(import.meta.url)), './preload.mjs'),
    },
  })

  const bounds = store.get('bounds')

  if (bounds) mainWindow.setBounds(bounds)

  const isFullscreen = store.get('fullscreen', false)
  if (isFullscreen) {
    mainWindow.setFullScreen(true)
  }

  let saveBoundsTimeout: NodeJS.Timeout | null = null
  const saveBounds = () => {
    if (saveBoundsTimeout) clearTimeout(saveBoundsTimeout)

    saveBoundsTimeout = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return

      if (!mainWindow.isFullScreen() && !mainWindow.isMinimized()) {
        store.set('bounds', mainWindow.getNormalBounds())
      }
      store.set('fullscreen', mainWindow.isFullScreen())
    }, 300)
  }

  mainWindow.on('move', saveBounds)
  mainWindow.on('resize', saveBounds)
  mainWindow.on('enter-full-screen', saveBounds)
  mainWindow.on('leave-full-screen', saveBounds)

  const sendFullscreen = () =>
    mainWindow?.webContents.send('fullscreen-changed', mainWindow.isFullScreen())
  mainWindow.on('enter-full-screen', sendFullscreen)
  mainWindow.on('leave-full-screen', sendFullscreen)
  mainWindow.webContents.on('did-finish-load', sendFullscreen)

  const sendFocus = () => mainWindow?.webContents.send('focus-changed', mainWindow.isFocused())
  mainWindow.on('blur', sendFocus)
  mainWindow.webContents.on('did-finish-load', sendFocus)

  mainWindow.on('close', () => {
    if (!mainWindow) return

    if (saveBoundsTimeout) clearTimeout(saveBoundsTimeout)

    if (!mainWindow.isFullScreen() && !mainWindow.isMinimized()) {
      store.set('bounds', mainWindow.getNormalBounds())
    }
    store.set('fullscreen', mainWindow.isFullScreen())
    mainWindow = null
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('focus', () => {
    buildMenu()
    sendFocus()
  })

  if (app.isPackaged) {
    mainWindow.loadFile(
      path.join(path.dirname(fileURLToPath(import.meta.url)), './renderer/index.html'),
    )
  } else {
    mainWindow.webContents.openDevTools()
    mainWindow.loadURL('https://app.local.tamery.app')
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

  setInterval(() => autoUpdater?.checkForUpdates(), 1000 * 60 * 10)
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

export function sendToast({
  message,
  description,
  type,
  duration,
}: {
  message: string
  description?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}) {
  mainWindow?.webContents.send('toast', { message, description, type, duration })
}

function sendUpdatesStatus(status: UpdatesStatus, message?: string) {
  mainWindow?.webContents.send('updates-status', { status, message })
}

autoUpdater?.on('checking-for-update', () => {
  sendUpdatesStatus('checking')
})
autoUpdater?.on('update-available', () => {
  sendUpdatesStatus('downloading')
})
autoUpdater?.on('update-not-available', () => {
  sendUpdatesStatus('no-updates')
})
autoUpdater?.on('error', e => {
  sendUpdatesStatus('error', e.message.split('\n')[0])
})
autoUpdater?.on('download-progress', () => {
  sendUpdatesStatus('downloading')
})
autoUpdater?.on('update-downloaded', () => {
  sendUpdatesStatus('ready')
})

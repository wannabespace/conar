import path from 'node:path'

import { resetTransactions } from '@tamery/connection/queries/transactions'
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH } from '@tamery/shared/constants'
import { isConnectionError } from '@tamery/shared/utils/connections'
import type { UpdatesStatus } from '@tamery/shared/utils/updates'
import type { Rectangle } from 'electron'
import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import Store from 'electron-store'

import { setupProtocolHandler } from './lib/deep-link'
import { initElectronEvents } from './lib/events'
import { buildMenu } from './lib/menu'
import { autoUpdater } from './lib/todesktop'

initElectronEvents()

process.on('uncaughtException', (error) => {
  if (isConnectionError(error)) {
    console.error('[Suppressed Connection Error]', error.message)
    return
  }
  throw error
})

process.on('unhandledRejection', (reason) => {
  if (isConnectionError(reason)) {
    console.error(
      '[Suppressed Connection Rejection]',
      reason instanceof Error ? reason.message : reason
    )
    return
  }
  throw reason
})

export const store = new Store<{
  bounds?: Rectangle
  fullscreen?: boolean
  maximized?: boolean
}>()

const NEW_WINDOW_OFFSET = 28

let mainWindow: BrowserWindow | null = null

export const createWindow = (route?: string) => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const isMac = process.platform === 'darwin'
  const isFirstWindow = BrowserWindow.getAllWindows().length === 0

  const win = new BrowserWindow({
    focusable: true,
    height,
    minHeight: MIN_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 13 },
    width,
    ...(!isMac && {
      titleBarOverlay: {
        color: '#00000000',
        height: 40,
        symbolColor: '#a1a1aa',
      },
    }),
    ...(isMac && {
      backgroundColor: '#00000000',
      vibrancy: 'under-window',
      visualEffectState: 'active',
    }),
    webPreferences: {
      preload: path.join(import.meta.dirname, './preload.mjs'),
      sandbox: false,
    },
  })

  mainWindow = win

  const bounds = store.get('bounds')

  if (bounds) {
    win.setBounds(
      isFirstWindow
        ? bounds
        : {
            ...bounds,
            x: bounds.x + NEW_WINDOW_OFFSET,
            y: bounds.y + NEW_WINDOW_OFFSET,
          }
    )
  }

  if (isFirstWindow) {
    if (store.get('maximized', false)) {
      win.maximize()
    }

    if (store.get('fullscreen', false)) {
      win.setFullScreen(true)
    }
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    const { protocol } = new URL(url)
    if (protocol === 'http:' || protocol === 'https:') {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  let saveBoundsTimeout: NodeJS.Timeout | null = null
  const saveBounds = () => {
    if (saveBoundsTimeout) {
      clearTimeout(saveBoundsTimeout)
    }

    saveBoundsTimeout = setTimeout(() => {
      if (win.isDestroyed()) {
        return
      }

      if (!win.isFullScreen() && !win.isMinimized()) {
        store.set('bounds', win.getNormalBounds())
        store.set('maximized', win.isMaximized())
      }
      store.set('fullscreen', win.isFullScreen())
    }, 300)
  }

  if (isFirstWindow) {
    win.on('move', saveBounds)
    win.on('resize', saveBounds)
    win.on('enter-full-screen', saveBounds)
    win.on('leave-full-screen', saveBounds)
  }

  const sendFullscreen = () =>
    win.webContents.send('fullscreen-changed', win.isFullScreen())
  win.on('enter-full-screen', sendFullscreen)
  win.on('leave-full-screen', sendFullscreen)
  win.webContents.on('did-finish-load', sendFullscreen)

  const sendFocus = () => win.webContents.send('focus-changed', win.isFocused())
  win.on('blur', sendFocus)
  win.webContents.on('did-finish-load', sendFocus)

  win.webContents.on('did-start-navigation', (details) => {
    if (details.isMainFrame && !details.isSameDocument) {
      void resetTransactions()
    }
  })

  win.on('close', () => {
    if (saveBoundsTimeout) {
      clearTimeout(saveBoundsTimeout)
    }

    if (isFirstWindow) {
      if (!win.isFullScreen() && !win.isMinimized()) {
        store.set('bounds', win.getNormalBounds())
        store.set('maximized', win.isMaximized())
      }
      store.set('fullscreen', win.isFullScreen())
    }

    if (mainWindow === win) {
      mainWindow = null
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.on('focus', () => {
    mainWindow = win
    buildMenu({ onNewWindow: createWindow })
    sendFocus()
  })

  if (app.isPackaged) {
    win.loadFile(
      path.join(import.meta.dirname, './renderer/index.html'),
      route ? { hash: route } : undefined
    )
  } else {
    win.webContents.openDevTools()
    win.loadURL(`https://app.local.tamery.app${route ? `#${route}` : ''}`)
  }

  return win
}

app.on('ready', () => {
  const win = createWindow()

  ipcMain.handle('app.openWindow', (_event, route: string) => {
    createWindow(route)
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

export const sendToast = ({
  message,
  description,
  type,
  duration,
}: {
  message: string
  description?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}) => {
  mainWindow?.webContents.send('toast', {
    description,
    duration,
    message,
    type,
  })
}

const sendUpdatesStatus = (status: UpdatesStatus, message?: string) => {
  mainWindow?.webContents.send('updates-status', { message, status })
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
autoUpdater?.on('error', (e) => {
  sendUpdatesStatus('error', e.message.split('\n')[0])
})
autoUpdater?.on('download-progress', () => {
  sendUpdatesStatus('downloading')
})
autoUpdater?.on('update-downloaded', () => {
  sendUpdatesStatus('ready')
})

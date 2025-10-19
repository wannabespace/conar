import type {
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron'
import { createRequire } from 'node:module'
import {
  app,
  Menu,
  screen,
  shell,
} from 'electron'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

type WindowSide = 'left' | 'right' | 'top' | 'bottom'

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string
  submenu?: DarwinMenuItemConstructorOptions[] | Menu
}

interface WorkAreaSize {
  width: number
  height: number
}

// Helper functions
function getWorkAreaSize(): WorkAreaSize {
  const display = screen.getPrimaryDisplay()
  return display.workAreaSize
}

function half(value: number): number {
  return Math.floor(value / 2)
}

function setWindowToHalf(mainWindow: BrowserWindow, side: WindowSide): void {
  const { width, height } = getWorkAreaSize()

  const halfWidth = half(width)
  const halfHeight = half(height)

  switch (side) {
    case 'left':
      mainWindow.setBounds({ x: 0, y: 0, width: halfWidth, height })
      break
    case 'right':
      mainWindow.setBounds({ x: halfWidth, y: 0, width: halfWidth, height })
      break
    case 'top':
      mainWindow.setBounds({ x: 0, y: 0, width, height: halfHeight })
      break
    case 'bottom':
      mainWindow.setBounds({ x: 0, y: halfHeight, width, height: halfHeight })
      break
  }
}

function fillWindow(mainWindow: BrowserWindow): void {
  const { width, height } = getWorkAreaSize()
  mainWindow.setBounds({ x: 0, y: 0, width, height })
}

function getHelpMenu(): MenuItemConstructorOptions {
  return {
    label: 'Help',
    submenu: [
      {
        label: 'Conar Website',
        click() {
          shell.openExternal('https://conar.app')
        },
      },
      {
        label: 'Documentation',
        click() {
          shell.openExternal('https://github.com/wannabespace/conar#readme')
        },
      },
      { type: 'separator' },
      {
        label: 'Give us a Star on GitHub',
        click() {
          shell.openExternal('https://github.com/wannabespace/conar')
        },
      },
      {
        label: 'Report Issue',
        click() {
          shell.openExternal('https://github.com/wannabespace/conar/issues')
        },
      },
    ],
  }
}

function setupDevelopmentEnvironment(mainWindow: BrowserWindow): void {
  mainWindow.webContents.on('context-menu', (_, props) => {
    const { x, y } = props

    Menu.buildFromTemplate([
      {
        label: 'Inspect element',
        click: () => {
          mainWindow.webContents.inspectElement(x, y)
        },
      },
    ]).popup({ window: mainWindow })
  })
}

function buildDarwinTemplate(mainWindow: BrowserWindow): MenuItemConstructorOptions[] {
  const subMenuAbout: DarwinMenuItemConstructorOptions = {
    label: 'Conar',
    submenu: [
      {
        label: 'About Conar',
        selector: 'orderFrontStandardAboutPanel:',
      },
      {
        label: 'Check for Updates...',
        click: () => {
          autoUpdater.checkForUpdates()
        },
      },
      { type: 'separator' },
      {
        label: 'Hide Conar',
        accelerator: 'Command+H',
        selector: 'hide:',
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:',
      },
      { label: 'Show All', selector: 'unhideAllApplications:' },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: () => {
          app.quit()
        },
      },
    ],
  }

  const subMenuFile: MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      {
        label: 'New Connection',
        accelerator: 'Command+N',
        click: () => {
          mainWindow.webContents.send('app.navigate', '/create')
        },
      },
      { type: 'separator' },
      {
        label: 'Close Window',
        accelerator: 'Command+W',
        click: () => {
          mainWindow.close()
        },
      },
    ],
  }

  const subMenuViewDev: MenuItemConstructorOptions = {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'Command+R',
        click: () => {
          mainWindow.webContents.reload()
        },
      },
      {
        label: 'Force Reload',
        accelerator: 'Shift+Command+R',
        click: () => {
          mainWindow.webContents.reloadIgnoringCache()
        },
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'Alt+Command+I',
        click: () => {
          mainWindow.webContents.toggleDevTools()
        },
      },
      { type: 'separator' },
      {
        label: 'Actual Size',
        accelerator: 'Command+0',
        click: () => {
          mainWindow.webContents.setZoomLevel(0)
        },
      },
      {
        label: 'Zoom In',
        accelerator: 'Command+Plus',
        click: () => {
          const currentZoom = mainWindow.webContents.getZoomLevel()
          mainWindow.webContents.setZoomLevel(currentZoom + 1)
        },
      },
      {
        label: 'Zoom Out',
        accelerator: 'Command+-',
        click: () => {
          const currentZoom = mainWindow.webContents.getZoomLevel()
          mainWindow.webContents.setZoomLevel(currentZoom - 1)
        },
      },
      { type: 'separator' },
      {
        label: 'Toggle Full Screen',
        accelerator: 'Ctrl+Command+F',
        click: () => {
          mainWindow.setFullScreen(!mainWindow.isFullScreen())
        },
      },
    ],
  }

  const subMenuViewProd: MenuItemConstructorOptions = {
    label: 'View',
    submenu: [
      {
        label: 'Actual Size',
        accelerator: 'Command+0',
        click: () => {
          mainWindow.webContents.setZoomLevel(0)
        },
      },
      {
        label: 'Zoom In',
        accelerator: 'Command+Plus',
        click: () => {
          const currentZoom = mainWindow.webContents.getZoomLevel()
          mainWindow.webContents.setZoomLevel(currentZoom + 1)
        },
      },
      {
        label: 'Zoom Out',
        accelerator: 'Command+-',
        click: () => {
          const currentZoom = mainWindow.webContents.getZoomLevel()
          mainWindow.webContents.setZoomLevel(currentZoom - 1)
        },
      },
      { type: 'separator' },
      {
        label: 'Toggle Full Screen',
        accelerator: 'Ctrl+Command+F',
        click: () => {
          mainWindow.setFullScreen(!mainWindow.isFullScreen())
        },
      },
    ],
  }

  const subMenuWindow: DarwinMenuItemConstructorOptions = {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'Command+M',
        selector: 'performMiniaturize:',
      },
      {
        label: 'Fill',
        click: () => {
          fillWindow(mainWindow)
        },
      },
      {
        label: 'Centre',
        click: () => {
          mainWindow.center()
        },
      },
      { type: 'separator' },
      {
        label: 'Move',
        submenu: [
          {
            label: 'Left',
            click: () => {
              setWindowToHalf(mainWindow, 'left')
            },
          },
          {
            label: 'Right',
            click: () => {
              setWindowToHalf(mainWindow, 'right')
            },
          },
          {
            label: 'Top',
            click: () => {
              setWindowToHalf(mainWindow, 'top')
            },
          },
          {
            label: 'Bottom',
            click: () => {
              setWindowToHalf(mainWindow, 'bottom')
            },
          },
        ],
      },
      {
        label: 'Full-Screen Tile',
        submenu: [
          {
            label: 'Tile Window to Left of Screen',
            click: () => {
              setWindowToHalf(mainWindow, 'left')
            },
          },
          {
            label: 'Tile Window to Right of Screen',
            click: () => {
              setWindowToHalf(mainWindow, 'right')
            },
          },
        ],
      },
      { type: 'separator' },
      { label: 'Bring All to Front', selector: 'arrangeInFront:' },
    ],
  }

  const subMenuView
    = process.env.NODE_ENV === 'development'
      || process.env.DEBUG_PROD === 'true'
      ? subMenuViewDev
      : subMenuViewProd

  return [subMenuAbout, subMenuFile, subMenuView, subMenuWindow, getHelpMenu()]
}

function buildDefaultTemplate(mainWindow: BrowserWindow): MenuItemConstructorOptions[] {
  const templateDefault: MenuItemConstructorOptions[] = [
    {
      label: '&File',
      submenu: [
        {
          label: '&New Connection',
          accelerator: 'Ctrl+N',
          click: () => {
            mainWindow.webContents.send('app.navigate', '/create')
          },
        },
        { type: 'separator' },
        {
          label: '&Close Window',
          accelerator: 'Ctrl+W',
          click: () => {
            mainWindow.close()
          },
        },
        {
          label: '&Quit',
          accelerator: 'Ctrl+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: '&View',
      submenu:
        process.env.NODE_ENV === 'development'
        || process.env.DEBUG_PROD === 'true'
          ? [
              {
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click: () => {
                  mainWindow.webContents.reload()
                },
              },
              {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: () => {
                  mainWindow.setFullScreen(
                    !mainWindow.isFullScreen(),
                  )
                },
              },
            ]
          : [
              {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: () => {
                  mainWindow.setFullScreen(
                    !mainWindow.isFullScreen(),
                  )
                },
              },
            ],
    },
    {
      label: '&Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Ctrl+M',
          click: () => {
            mainWindow.minimize()
          },
        },
        {
          label: 'Zoom',
          click: () => {
            mainWindow.maximize()
          },
        },
        { type: 'separator' },
        {
          label: 'Close',
          accelerator: 'Ctrl+W',
          click: () => {
            mainWindow.close()
          },
        },
      ],
    },
    getHelpMenu(),
  ]

  return templateDefault
}

export function buildMenu(mainWindow: BrowserWindow): Menu {
  if (
    process.env.NODE_ENV === 'development'
    || process.env.DEBUG_PROD === 'true'
  ) {
    setupDevelopmentEnvironment(mainWindow)
  }

  const template
    = process.platform === 'darwin'
      ? buildDarwinTemplate(mainWindow)
      : buildDefaultTemplate(mainWindow)

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  return menu
}

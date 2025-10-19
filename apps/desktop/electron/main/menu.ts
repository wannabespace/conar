import type {
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron'
import { createRequire } from 'node:module'
import { SOCIAL_LINKS } from '@conar/shared/constants'
import {
  app,
  Menu,
  screen,
  shell,
} from 'electron'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

type WindowSide = 'left' | 'right' | 'top' | 'bottom'
type WindowQuarter = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

function getWorkAreaSize() {
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

function setWindowToQuarter(mainWindow: BrowserWindow, quarter: WindowQuarter) {
  const { width, height } = getWorkAreaSize()
  const halfWidth = half(width)
  const halfHeight = half(height)
  switch (quarter) {
    case 'topLeft':
      mainWindow.setBounds({ x: 0, y: 0, width: halfWidth, height: halfHeight })
      break
    case 'topRight':
      mainWindow.setBounds({ x: halfWidth, y: 0, width: halfWidth, height: halfHeight })
      break
    case 'bottomLeft':
      mainWindow.setBounds({ x: 0, y: halfHeight, width: halfWidth, height: halfHeight })
      break
    case 'bottomRight':
      mainWindow.setBounds({ x: halfWidth, y: halfHeight, width: halfWidth, height: halfHeight })
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
          shell.openExternal(`${SOCIAL_LINKS.GITHUB}#readme`)
        },
      },
      { type: 'separator' },
      {
        label: 'Give us a Star on GitHub',
        click() {
          shell.openExternal(SOCIAL_LINKS.GITHUB)
        },
      },
      {
        label: 'Report Issue',
        click() {
          shell.openExternal(`${SOCIAL_LINKS.GITHUB}/issues/new/choose`)
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

function buildTemplate(mainWindow: BrowserWindow): MenuItemConstructorOptions[] {
  const isMac = process.platform === 'darwin'
  const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
  const cmdOrCtrl = isMac ? 'Command' : 'Ctrl'

  const moveAndResizeSubmenu: MenuItemConstructorOptions = {
    label: 'Move && Resize',
    submenu: [
      { label: 'Halves', enabled: false },
      { label: 'Left', accelerator: 'Ctrl+Alt+Left', click: () => setWindowToHalf(mainWindow, 'left') },
      { label: 'Right', accelerator: 'Ctrl+Alt+Right', click: () => setWindowToHalf(mainWindow, 'right') },
      { label: 'Top', accelerator: 'Ctrl+Alt+Up', click: () => setWindowToHalf(mainWindow, 'top') },
      { label: 'Bottom', accelerator: 'Ctrl+Alt+Down', click: () => setWindowToHalf(mainWindow, 'bottom') },
      { type: 'separator' },
      { label: 'Quarters', enabled: false },
      { label: 'Top Left', accelerator: 'Ctrl+Alt+1', click: () => setWindowToQuarter(mainWindow, 'topLeft') },
      { label: 'Top Right', accelerator: 'Ctrl+Alt+2', click: () => setWindowToQuarter(mainWindow, 'topRight') },
      { label: 'Bottom Left', accelerator: 'Ctrl+Alt+3', click: () => setWindowToQuarter(mainWindow, 'bottomLeft') },
      { label: 'Bottom Right', accelerator: 'Ctrl+Alt+4', click: () => setWindowToQuarter(mainWindow, 'bottomRight') },
    ],
  }

  const template: MenuItemConstructorOptions[] = []

  if (isMac) {
    const appMenu = {
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
    } as MenuItemConstructorOptions
    template.push(appMenu)
  }

  const fileMenuSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'New Connection',
      accelerator: `${cmdOrCtrl}+N`,
      click: () => {
        mainWindow.webContents.send('app.navigate', '/create')
      },
    },
    { type: 'separator' },
    {
      label: 'Close Window',
      accelerator: `${cmdOrCtrl}+W`,
      click: () => {
        mainWindow.close()
      },
    },
  ]

  if (!isMac) {
    fileMenuSubmenu.push({
      label: 'Quit',
      accelerator: 'Ctrl+Q',
      click: () => {
        app.quit()
      },
    })
  }

  template.push({
    label: 'File',
    submenu: fileMenuSubmenu,
  })

  const viewMenuSubmenu: MenuItemConstructorOptions[] = []

  if (isDev) {
    viewMenuSubmenu.push(
      {
        label: 'Reload',
        accelerator: `${cmdOrCtrl}+R`,
        click: () => {
          mainWindow.webContents.reload()
        },
      },
      {
        label: 'Force Reload',
        accelerator: `${cmdOrCtrl}+Shift+R`,
        click: () => {
          mainWindow.webContents.reloadIgnoringCache()
        },
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click: () => {
          mainWindow.webContents.toggleDevTools()
        },
      },
    )
    viewMenuSubmenu.push({ type: 'separator' })
  }

  if (isMac) {
    viewMenuSubmenu.push(
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
    )
  }

  viewMenuSubmenu.push({
    label: 'Toggle Full Screen',
    accelerator: isMac ? 'Ctrl+Command+F' : 'F11',
    click: () => {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    },
  })

  template.push({
    label: 'View',
    submenu: viewMenuSubmenu,
  })

  const windowMenuSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Fill',
      accelerator: 'Ctrl+Alt+F',
      click: () => {
        fillWindow(mainWindow)
      },
    },
    {
      label: 'Center',
      accelerator: 'Ctrl+Alt+C',
      click: () => {
        mainWindow.center()
      },
    },
    moveAndResizeSubmenu,
    { type: 'separator' },
    {
      label: 'Minimize',
      accelerator: `${cmdOrCtrl}+M`,
      click: () => {
        mainWindow.minimize()
      },
    },
  ]

  if (!isMac) {
    windowMenuSubmenu.push({
      label: 'Maximize',
      accelerator: 'Ctrl+Shift+M',
      click: () => {
        mainWindow.maximize()
      },
    })
  }

  windowMenuSubmenu.push({
    label: 'Close',
    accelerator: `${cmdOrCtrl}+W`,
    click: () => {
      mainWindow.close()
    },
  })

  template.push({
    label: 'Window',
    submenu: windowMenuSubmenu,
  })

  template.push(getHelpMenu())

  return template
}

export function buildMenu(mainWindow: BrowserWindow): Menu {
  if (
    process.env.NODE_ENV === 'development'
    || process.env.DEBUG_PROD === 'true'
  ) {
    setupDevelopmentEnvironment(mainWindow)
  }

  const template = buildTemplate(mainWindow)
  const menu = Menu.buildFromTemplate(template)

  Menu.setApplicationMenu(menu)

  return menu
}

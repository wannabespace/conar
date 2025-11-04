import type { MenuItemConstructorOptions } from 'electron'
import { createRequire } from 'node:module'
import { SOCIAL_LINKS } from '@conar/shared/constants'
import { app, BrowserWindow, Menu, shell } from 'electron'
import { createWindow } from './index'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater') as typeof import('electron-updater')

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
  const cmdOrCtrl = isMac ? 'Command' : 'Ctrl'

  const template: MenuItemConstructorOptions[] = []

  if (isMac) {
    const appMenu = {
      role: 'appMenu',
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

  template.push({
    role: 'fileMenu',
    submenu: [
      {
        label: 'New Connection',
        accelerator: `${cmdOrCtrl}+N`,
        click: () => {
          mainWindow.webContents.send('app.navigate', '/create')
        },
      },
      {
        label: 'New Window',
        accelerator: `${cmdOrCtrl}+Shift+N`,
        click: () => {
          createWindow()
        },
      },
      { type: 'separator' },
      {
        label: 'Close Window',
        accelerator: `${cmdOrCtrl}+W`,
        click: () => {
          const currentWindow = BrowserWindow.getAllWindows().find(window => window.isFocused())
          if (!currentWindow)
            return

          currentWindow.close()
        },
      },
    ],
  })

  template.push({
    role: 'editMenu',
  })

  template.push({
    role: 'viewMenu',
  })

  template.push({
    role: 'windowMenu',
  })

  template.push({
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
  })

  return template
}

export function buildMenu(mainWindow: BrowserWindow): Menu {
  if (process.env.NODE_ENV === 'development') {
    setupDevelopmentEnvironment(mainWindow)
  }

  const template = buildTemplate(mainWindow)
  const menu = Menu.buildFromTemplate(template)

  Menu.setApplicationMenu(menu)

  return menu
}

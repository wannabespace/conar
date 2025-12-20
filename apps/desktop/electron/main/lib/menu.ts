import type { MenuItemConstructorOptions } from 'electron'
import { SOCIAL_LINKS } from '@conar/shared/constants'
import { app, BrowserWindow, Menu, shell } from 'electron'
import { autoUpdater, createWindow } from '../'

function getFocusedWindow() {
  return BrowserWindow.getAllWindows().find((window) => window.isFocused())
}

function setupDevelopmentEnvironment(): void {
  const mainWindow = getFocusedWindow()

  if (!mainWindow) return

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

function buildTemplate(): MenuItemConstructorOptions[] {
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
            autoUpdater?.checkForUpdates()
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
          const win = getFocusedWindow()
          if (!win) return

          win.close()
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

export function buildMenu(): Menu {
  if (process.env.NODE_ENV === 'development') {
    setupDevelopmentEnvironment()
  }

  const template = buildTemplate()
  const menu = Menu.buildFromTemplate(template)

  Menu.setApplicationMenu(menu)

  return menu
}

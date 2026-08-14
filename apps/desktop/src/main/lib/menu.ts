import { SOCIAL_LINKS } from '@tamery/shared/constants'
import type { MenuItemConstructorOptions } from 'electron'
import { app, BrowserWindow, Menu, shell } from 'electron'

import { autoUpdater, createWindow } from '../main'

const getFocusedWindow = () =>
  BrowserWindow.getAllWindows().find((window) => window.isFocused())

const setupDevelopmentEnvironment = (): void => {
  const mainWindow = getFocusedWindow()

  if (!mainWindow) {
    return
  }

  mainWindow.webContents.on('context-menu', (_, props) => {
    const { x, y } = props

    Menu.buildFromTemplate([
      {
        click: () => {
          mainWindow.webContents.inspectElement(x, y)
        },
        label: 'Inspect element',
      },
    ]).popup({ window: mainWindow })
  })
}

const buildTemplate = (): MenuItemConstructorOptions[] => {
  const isMac = process.platform === 'darwin'
  const cmdOrCtrl = isMac ? 'Command' : 'Ctrl'

  const template: MenuItemConstructorOptions[] = []

  if (isMac) {
    const appMenu = {
      label: 'Tamery',
      role: 'appMenu',
      submenu: [
        {
          label: 'About Tamery',
          selector: 'orderFrontStandardAboutPanel:',
        },
        {
          click: () => {
            autoUpdater?.checkForUpdates()
          },
          label: 'Check for Updates...',
        },
        { type: 'separator' },
        {
          accelerator: 'Command+H',
          label: 'Hide Tamery',
          selector: 'hide:',
        },
        {
          accelerator: 'Command+Shift+H',
          label: 'Hide Others',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          accelerator: 'Command+Q',
          click: () => {
            app.quit()
          },
          label: 'Quit',
        },
      ],
    } as MenuItemConstructorOptions
    template.push(appMenu)
  }

  template.push(
    {
      role: 'fileMenu',
      submenu: [
        {
          accelerator: `${cmdOrCtrl}+Shift+N`,
          click: () => {
            createWindow()
          },
          label: 'New Window',
        },
        { type: 'separator' },
        {
          accelerator: `${cmdOrCtrl}+W`,
          click: () => {
            const win = getFocusedWindow()
            if (!win) {
              return
            }

            win.close()
          },
          label: 'Close Window',
        },
      ],
    },
    {
      role: 'editMenu',
    },
    {
      role: 'viewMenu',
    },
    {
      role: 'windowMenu',
    },
    {
      label: 'Help',
      submenu: [
        {
          click() {
            shell.openExternal('https://tamery.app')
          },
          label: 'Tamery Website',
        },
        {
          click() {
            shell.openExternal(`${SOCIAL_LINKS.GITHUB}#readme`)
          },
          label: 'Documentation',
        },
        { type: 'separator' },
        {
          click() {
            shell.openExternal(SOCIAL_LINKS.GITHUB)
          },
          label: 'Give us a Star on GitHub',
        },
        {
          click() {
            shell.openExternal(`${SOCIAL_LINKS.GITHUB}/issues/new/choose`)
          },
          label: 'Report Issue',
        },
      ],
    }
  )

  return template
}

export const buildMenu = (): Menu => {
  if (!app.isPackaged) {
    setupDevelopmentEnvironment()
  }

  const template = buildTemplate()
  const menu = Menu.buildFromTemplate(template)

  Menu.setApplicationMenu(menu)

  return menu
}

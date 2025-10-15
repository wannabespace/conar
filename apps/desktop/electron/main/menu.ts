import type {
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron'
import {
  app,
  Menu,
  screen,
  shell,
} from 'electron'

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string
  submenu?: DarwinMenuItemConstructorOptions[] | Menu
}

export default class MenuBuilder {
  mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  private getWorkAreaSize() {
    const display = screen.getPrimaryDisplay()
    return display.workAreaSize
  }

  private half(value: number): number {
    return Math.floor(value / 2)
  }

  private setWindowToHalf(side: 'left' | 'right' | 'top' | 'bottom') {
    const { width, height } = this.getWorkAreaSize()
    
    const halfWidth = this.half(width)
    const halfHeight = this.half(height)
    
    switch (side) {
      case 'left':
        this.mainWindow.setBounds({ x: 0, y: 0, width: halfWidth, height })
        break
      case 'right':
        this.mainWindow.setBounds({ x: halfWidth, y: 0, width: halfWidth, height })
        break
      case 'top':
        this.mainWindow.setBounds({ x: 0, y: 0, width, height: halfHeight })
        break
      case 'bottom':
        this.mainWindow.setBounds({ x: 0, y: halfHeight, width, height: halfHeight })
        break
    }
  }

  private fillWindow() {
    const { width, height } = this.getWorkAreaSize()
    this.mainWindow.setBounds({ x: 0, y: 0, width, height })
  }

  private getHelpMenu(): MenuItemConstructorOptions {
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

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development'
      || process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment()
    }

    const template
      = process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate()

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    return menu
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y)
          },
        },
      ]).popup({ window: this.mainWindow })
    })
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
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
            this.mainWindow.webContents.send('check-for-updates')
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
            this.mainWindow.webContents.send('navigate-to', '/create')
          },
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'Command+W',
          click: () => {
            this.mainWindow.close()
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
            this.mainWindow.webContents.reload()
          },
        },
        {
          label: 'Force Reload',
          accelerator: 'Shift+Command+R',
          click: () => {
            this.mainWindow.webContents.reloadIgnoringCache()
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools()
          },
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'Command+0',
          click: () => {
            this.mainWindow.webContents.setZoomLevel(0)
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'Command+Plus',
          click: () => {
            const currentZoom = this.mainWindow.webContents.getZoomLevel()
            this.mainWindow.webContents.setZoomLevel(currentZoom + 1)
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'Command+-',
          click: () => {
            const currentZoom = this.mainWindow.webContents.getZoomLevel()
            this.mainWindow.webContents.setZoomLevel(currentZoom - 1)
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
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
            this.mainWindow.webContents.setZoomLevel(0)
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'Command+Plus',
          click: () => {
            const currentZoom = this.mainWindow.webContents.getZoomLevel()
            this.mainWindow.webContents.setZoomLevel(currentZoom + 1)
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'Command+-',
          click: () => {
            const currentZoom = this.mainWindow.webContents.getZoomLevel()
            this.mainWindow.webContents.setZoomLevel(currentZoom - 1)
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
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
            this.fillWindow()
          },
        },
        {
          label: 'Centre',
          click: () => {
            this.mainWindow.center()
          },
        },
        { type: 'separator' },
        {
          label: 'Move',
          submenu: [
            {
              label: 'Left',
              click: () => {
                this.setWindowToHalf('left')
              },
            },
            {
              label: 'Right',
              click: () => {
                this.setWindowToHalf('right')
              },
            },
            {
              label: 'Top',
              click: () => {
                this.setWindowToHalf('top')
              },
            },
            {
              label: 'Bottom',
              click: () => {
                this.setWindowToHalf('bottom')
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
                this.setWindowToHalf('left')
              },
            },
            {
              label: 'Tile Window to Right of Screen',
              click: () => {
                this.setWindowToHalf('right')
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

    return [subMenuAbout, subMenuFile, subMenuView, subMenuWindow, this.getHelpMenu()]
  }

  buildDefaultTemplate(): MenuItemConstructorOptions[] {
    const templateDefault: MenuItemConstructorOptions[] = [
      {
        label: '&File',
        submenu: [
          {
            label: '&New Connection',
            accelerator: 'Ctrl+N',
            click: () => {
              this.mainWindow.webContents.send('navigate-to', '/create')
            },
          },
          { type: 'separator' },
          {
            label: '&Close Window',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close()
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
                    this.mainWindow.webContents.reload()
                  },
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen(),
                    )
                  },
                },
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen(),
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
              this.mainWindow.minimize()
            },
          },
          {
            label: 'Zoom',
            click: () => {
              this.mainWindow.maximize()
            },
          },
          { type: 'separator' },
          {
            label: 'Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close()
            },
          },
        ],
      },
      this.getHelpMenu(),
    ]

    return templateDefault
  }
}

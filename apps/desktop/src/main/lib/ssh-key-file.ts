import { homedir } from 'node:os'
import path from 'node:path'

import type { OpenDialogOptions } from 'electron'
import { BrowserWindow, dialog } from 'electron'

export const pickSshKeyFile = async () => {
  const options: OpenDialogOptions = {
    buttonLabel: 'Choose',
    defaultPath: path.join(homedir(), '.ssh'),
    properties: ['openFile', 'showHiddenFiles'],
  }
  const window = BrowserWindow.getFocusedWindow()
  const { filePaths } = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  const [filePath] = filePaths
  if (!filePath) {
    return null
  }
  return filePath.startsWith(`${homedir()}/`)
    ? `~${filePath.slice(homedir().length)}`
    : filePath
}

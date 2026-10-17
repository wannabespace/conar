import type { OpenDialogOptions } from 'electron'
import { BrowserWindow, dialog } from 'electron'

export const pickFile = async (options: OpenDialogOptions) => {
  const window = BrowserWindow.getFocusedWindow()
  const { filePaths } = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  return filePaths[0] ?? null
}

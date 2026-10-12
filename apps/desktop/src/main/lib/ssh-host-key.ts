import type { ConfirmHostKey } from '@tamery/connection/ssh/tunnel'
import type { MessageBoxOptions } from 'electron'
import { BrowserWindow, dialog } from 'electron'

const TRUST = 0

export const confirmHostKey: ConfirmHostKey = async ({
  fingerprint,
  host,
  keyType,
}) => {
  const options: MessageBoxOptions = {
    buttons: ['Trust and Connect', 'Cancel'],
    cancelId: 1,
    defaultId: TRUST,
    detail: `${keyType} key fingerprint:\n${fingerprint}\n\nConnect only if this matches the server's key. Tamery adds it to ~/.ssh/known_hosts.`,
    message: `Trust the SSH host ${host}?`,
    type: 'warning',
  }
  const window = BrowserWindow.getAllWindows().find((item) => item.isFocused())
  const { response } = window
    ? await dialog.showMessageBox(window, options)
    : await dialog.showMessageBox(options)
  return response === TRUST
}

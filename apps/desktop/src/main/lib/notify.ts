import { BrowserWindow, Notification } from 'electron'

import { focusMainWindow } from './deep-link'

// A notification nobody references is garbage-collected on macOS, and its click handler with it.
const shown = new Set<Notification>()

export const notifyUnfocused = (options: { body: string; title: string }) => {
  // Not getFocusedWindow(): it also counts a focused DevTools panel, which stays focused while another app is in front.
  if (
    BrowserWindow.getAllWindows().some((window) => window.isFocused()) ||
    !Notification.isSupported()
  ) {
    return
  }
  const notification = new Notification(options)
  shown.add(notification)
  notification.on('click', () => {
    shown.delete(notification)
    focusMainWindow()
  })
  notification.on('close', () => shown.delete(notification))
  notification.on('failed', () => shown.delete(notification))
  notification.show()
}

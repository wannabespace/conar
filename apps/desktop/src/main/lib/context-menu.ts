import type {
  MenuPopupRequest,
  MenuPopupResult,
  NativeMenuNode,
} from '@tamery/shared/context-menu'
import type { IpcMainInvokeEvent, MenuItemConstructorOptions } from 'electron'
import { BrowserWindow, Menu } from 'electron'

// `click` can fire after the close `callback` on some platforms; give a late
// click time to win before resolving the dismissal as "nothing selected".
const CLOSE_RESOLVE_DELAY_MS = 150

export const popupNativeContextMenu = (
  { items }: MenuPopupRequest,
  event?: IpcMainInvokeEvent
): Promise<MenuPopupResult> =>
  // Electron Menu.popup resolves via callback; Promise constructor is required.
  // oxlint-disable-next-line promise/avoid-new
  new Promise((resolve) => {
    let settled = false
    const settle = (id: MenuPopupResult) => {
      if (settled) {
        return
      }
      settled = true
      resolve(id)
    }

    const toTemplate = (
      nodes: NativeMenuNode[]
    ): MenuItemConstructorOptions[] =>
      nodes.map((node) => {
        switch (node.type) {
          case 'separator': {
            return { type: 'separator' }
          }
          case 'label': {
            return process.platform === 'darwin'
              ? { label: node.label, type: 'header' }
              : { enabled: false, label: node.label }
          }
          case 'submenu': {
            return {
              enabled: node.enabled !== false,
              label: node.label,
              submenu: toTemplate(node.items),
            }
          }
          case 'item': {
            return {
              accelerator: node.accelerator,
              checked: node.checked,
              click: () => settle(node.id),
              enabled: node.enabled !== false,
              label: node.label,
              registerAccelerator: false,
              type: node.kind ?? 'normal',
            }
          }
          default: {
            throw new Error(
              `Unknown context menu node: ${JSON.stringify(node)}`
            )
          }
        }
      })

    const window =
      (event && BrowserWindow.fromWebContents(event.sender)) ??
      BrowserWindow.getFocusedWindow() ??
      undefined

    Menu.buildFromTemplate(toTemplate(items)).popup({
      callback: () => setTimeout(() => settle(null), CLOSE_RESOLVE_DELAY_MS),
      window: window ?? undefined,
    })
  })

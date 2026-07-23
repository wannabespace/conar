import type { MenuPopupRequest, MenuPopupResult, NativeMenuNode } from '@tamery/shared/context-menu'
import type { IpcMainInvokeEvent, MenuItemConstructorOptions } from 'electron'
import { BrowserWindow, Menu } from 'electron'

// `click` can fire after the close `callback` on some platforms; give a late
// click time to win before resolving the dismissal as "nothing selected".
const CLOSE_RESOLVE_DELAY_MS = 150

export function popupNativeContextMenu(
  { items }: MenuPopupRequest,
  event?: IpcMainInvokeEvent,
): Promise<MenuPopupResult> {
  return new Promise(resolve => {
    let settled = false
    const settle = (id: MenuPopupResult) => {
      if (settled) return
      settled = true
      resolve(id)
    }

    const toTemplate = (nodes: NativeMenuNode[]): MenuItemConstructorOptions[] =>
      nodes.map(node => {
        switch (node.type) {
          case 'separator':
            return { type: 'separator' }
          case 'label':
            return process.platform === 'darwin'
              ? { type: 'header', label: node.label }
              : { label: node.label, enabled: false }
          case 'submenu':
            return {
              label: node.label,
              enabled: node.enabled !== false,
              submenu: toTemplate(node.items),
            }
          case 'item':
            return {
              type: node.kind ?? 'normal',
              label: node.label,
              enabled: node.enabled !== false,
              checked: node.checked,
              accelerator: node.accelerator,
              registerAccelerator: false,
              click: () => settle(node.id),
            }
          default:
            throw new Error(`Unknown context menu node: ${JSON.stringify(node)}`)
        }
      })

    const window =
      (event && BrowserWindow.fromWebContents(event.sender)) ??
      BrowserWindow.getFocusedWindow() ??
      undefined

    Menu.buildFromTemplate(toTemplate(items)).popup({
      window: window ?? undefined,
      callback: () => setTimeout(() => settle(null), CLOSE_RESOLVE_DELAY_MS),
    })
  })
}

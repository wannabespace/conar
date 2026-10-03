import {
  AppWindowIcon,
  ArrowDown02Icon,
  ArrowLeftRightIcon,
  ArrowRight02Icon,
  ArrowUp02Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CancelSquareIcon,
  CodeIcon,
  Copy01Icon,
  Csv01Icon,
  Delete02Icon,
  EraserIcon,
  FilterAddIcon,
  Link01Icon,
  LinkSquare02Icon,
  PauseIcon,
  PencilEdit01Icon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  PlusSignIcon,
  Refresh01Icon,
  SaveIcon,
  SecurityBlockIcon,
  SecurityCheckIcon,
  Sorting01Icon,
  SparklesIcon,
  SquareUnlock01Icon,
  TextIcon,
  Undo02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import type {
  MenuPopupRequest,
  MenuPopupResult,
  NativeMenuNode,
  SFSymbol,
} from '@tamery/shared/context-menu'

import type { AppMenuNode } from '~/components/app-menu'

const sfSymbols = new Map<IconSvgElement, SFSymbol>([
  [AppWindowIcon, 'macwindow'],
  [ArrowDown02Icon, 'arrow.down'],
  [ArrowLeftRightIcon, 'arrow.left.and.right'],
  [ArrowRight02Icon, 'arrow.right'],
  [ArrowUp02Icon, 'arrow.up'],
  [Cancel01Icon, 'xmark'],
  [CancelCircleIcon, 'xmark.circle'],
  [CancelSquareIcon, 'xmark.square'],
  [CodeIcon, 'curlybraces'],
  [Copy01Icon, 'doc.on.doc'],
  [Csv01Icon, 'tablecells'],
  [Delete02Icon, 'trash'],
  [EraserIcon, 'eraser'],
  [FilterAddIcon, 'line.3.horizontal.decrease'],
  [Link01Icon, 'link'],
  [LinkSquare02Icon, 'arrow.up.forward.square'],
  [PauseIcon, 'pause'],
  [PencilEdit01Icon, 'pencil'],
  [PencilEdit02Icon, 'pencil'],
  [PinIcon, 'pin'],
  [PinOffIcon, 'pin.slash'],
  [PlayIcon, 'play'],
  [PlusSignIcon, 'plus'],
  [Refresh01Icon, 'arrow.clockwise'],
  [SaveIcon, 'square.and.arrow.down'],
  [SecurityBlockIcon, 'xmark.shield'],
  [SecurityCheckIcon, 'checkmark.shield'],
  [Sorting01Icon, 'arrow.up.arrow.down'],
  [SparklesIcon, 'sparkles'],
  [SquareUnlock01Icon, 'lock.open'],
  [TextIcon, 'text.alignleft'],
  [Undo02Icon, 'arrow.uturn.backward'],
  [ViewIcon, 'eye'],
  [ViewOffSlashIcon, 'eye.slash'],
])

export const isNativeAvailable = () => !!window.electron?.menu?.popup

export const popupNativeMenu = async ({
  nativeItems,
  handlers,
  onClose,
  position,
}: {
  nativeItems: NativeMenuNode[]
  handlers: Map<string, () => void>
  onClose: () => void
  position?: MenuPopupRequest['position']
}) => {
  let clickedId: MenuPopupResult = null
  try {
    const electronMenu = window.electron?.menu
    if (!electronMenu) {
      throw new Error('Native menu is not available')
    }
    clickedId = await electronMenu.popup({ items: nativeItems, position })
  } finally {
    if (clickedId !== null) {
      handlers.get(clickedId)?.()
    }
    onClose()
  }
}

export const toNativeMenu = (
  nodes: AppMenuNode[]
): {
  nativeItems: NativeMenuNode[]
  handlers: Map<string, () => void>
} => {
  const handlers = new Map<string, () => void>()
  let counter = 0

  const walk = (input: AppMenuNode[]): NativeMenuNode[] => {
    const result: NativeMenuNode[] = []

    for (const node of input) {
      switch (node.type) {
        case 'separator': {
          result.push({ type: 'separator' })
          break
        }
        case 'label': {
          result.push({ label: node.label, type: 'label' })
          break
        }
        case 'group': {
          if (node.label) {
            result.push({ label: node.label, type: 'label' })
          }
          result.push(...walk(node.items))
          break
        }
        case 'sub': {
          result.push({
            enabled: !node.disabled,
            items: walk(node.items),
            label: node.label,
            symbol: node.icon && sfSymbols.get(node.icon),
            type: 'submenu',
          })
          break
        }
        case 'radio': {
          for (const option of node.options) {
            const id = `n${(counter += 1)}`
            handlers.set(id, () => node.onValueChange(option.value))
            result.push({
              checked: option.value === node.value,
              enabled: !option.disabled,
              id,
              kind: 'radio',
              label: option.label,
              type: 'item',
            })
          }
          break
        }
        default: {
          const id = `n${(counter += 1)}`
          handlers.set(id, node.onSelect)
          result.push({
            accelerator: node.accelerator,
            checked: node.checked,
            enabled: !node.disabled,
            id,
            kind: node.checked === undefined ? 'normal' : 'checkbox',
            label: node.nativeLabel ?? node.label,
            symbol: node.icon && sfSymbols.get(node.icon),
            type: 'item',
          })
        }
      }
    }

    return result
  }

  return { handlers, nativeItems: walk(nodes) }
}

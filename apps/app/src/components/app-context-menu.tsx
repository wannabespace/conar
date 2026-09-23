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
  MoreHorizontalIcon,
  PauseIcon,
  PencilEdit01Icon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  Refresh01Icon,
  Sorting01Icon,
  SquareUnlock01Icon,
  TextIcon,
  Undo02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import type {
  MenuPopupRequest,
  MenuPopupResult,
  NativeMenuNode,
} from '@tamery/shared/context-menu'
import { Button } from '@tamery/ui/components/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@tamery/ui/components/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { cn } from '@tamery/ui/lib/utils'
import type {
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react'
import { cloneElement, useState } from 'react'

export interface AppMenuItem {
  type?: 'item'
  label: string
  onSelect: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive'
  /** Native only: renders a checkbox-style checkmark. Web styles via `className`/`icon`. */
  checked?: boolean
  /** Native menus show its `sfSymbols` twin; unmapped icons render web-only. */
  icon?: IconSvgElement
  /** Web only: right-aligned shortcut hint. */
  shortcut?: ReactNode
  /** Web only: raw right-aligned node. */
  trailing?: ReactNode
  /** Native only: display-only accelerator hint, e.g. `'CmdOrCtrl+W'`. */
  accelerator?: string
  /** Native only: label override (fold web-only trailing info into the text). */
  nativeLabel?: string
  /** Web only. */
  className?: string
}

export interface AppMenuSeparator {
  type: 'separator'
}

export interface AppMenuLabel {
  type: 'label'
  label: string
}

export interface AppMenuGroup {
  type: 'group'
  label?: string
  items: AppMenuNode[]
}

export interface AppMenuSub {
  type: 'sub'
  label: string
  disabled?: boolean
  icon?: IconSvgElement
  items: AppMenuNode[]
}

export interface AppMenuRadioGroup {
  type: 'radio'
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
}

export type AppMenuNode =
  | AppMenuItem
  | AppMenuSeparator
  | AppMenuLabel
  | AppMenuGroup
  | AppMenuSub
  | AppMenuRadioGroup

interface AppContextMenuProps {
  items: AppMenuNode[] | (() => AppMenuNode[])
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  render?: ReactElement
  className?: string
  style?: CSSProperties
  contentProps?: {
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
    className?: string
  }
}

const sfSymbols = new Map<IconSvgElement, string>([
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
  [PauseIcon, 'pause'],
  [PencilEdit01Icon, 'pencil'],
  [PencilEdit02Icon, 'pencil'],
  [PinIcon, 'pin'],
  [PinOffIcon, 'pin.slash'],
  [PlayIcon, 'play'],
  [Refresh01Icon, 'arrow.clockwise'],
  [Sorting01Icon, 'arrow.up.arrow.down'],
  [SquareUnlock01Icon, 'lock.open'],
  [TextIcon, 'text.alignleft'],
  [Undo02Icon, 'arrow.uturn.backward'],
  [ViewIcon, 'eye'],
  [ViewOffSlashIcon, 'eye.slash'],
])

const menuIcon = (icon?: IconSvgElement) =>
  icon && <HugeiconsIcon icon={icon} strokeWidth={2} />

const isNativeAvailable = () => !!window.electron?.menu?.popup

const contextMenuParts = {
  Group: ContextMenuGroup,
  Item: ContextMenuItem,
  Label: ContextMenuLabel,
  RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
  Separator: ContextMenuSeparator,
  Sub: ContextMenuSub,
  SubContent: ContextMenuSubContent,
  SubTrigger: ContextMenuSubTrigger,
}

const dropdownMenuParts: typeof contextMenuParts = {
  Group: DropdownMenuGroup,
  Item: DropdownMenuItem,
  Label: DropdownMenuLabel,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubContent: DropdownMenuSubContent,
  SubTrigger: DropdownMenuSubTrigger,
}

const renderWebNodes = (
  nodes: AppMenuNode[],
  parts: typeof contextMenuParts
): ReactNode =>
  nodes.map((node, index) => {
    switch (node.type) {
      case 'separator': {
        // oxlint-disable-next-line react/no-array-index-key
        return <parts.Separator key={index} />
      }
      case 'label': {
        // oxlint-disable-next-line react/no-array-index-key
        return <parts.Label key={index}>{node.label}</parts.Label>
      }
      case 'group': {
        return (
          // oxlint-disable-next-line react/no-array-index-key
          <parts.Group key={index}>
            {node.label && <parts.Label>{node.label}</parts.Label>}
            {renderWebNodes(node.items, parts)}
          </parts.Group>
        )
      }
      case 'sub': {
        return (
          // oxlint-disable-next-line react/no-array-index-key
          <parts.Sub key={index}>
            <parts.SubTrigger disabled={node.disabled}>
              {menuIcon(node.icon)}
              {node.label}
            </parts.SubTrigger>
            <parts.SubContent>
              {renderWebNodes(node.items, parts)}
            </parts.SubContent>
          </parts.Sub>
        )
      }
      case 'radio': {
        const handleValueChange = (value: string) => {
          node.onValueChange(value)
        }
        return (
          <parts.RadioGroup
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
            value={node.value}
            onValueChange={handleValueChange}
          >
            {node.options.map((option) => (
              <parts.RadioItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </parts.RadioItem>
            ))}
          </parts.RadioGroup>
        )
      }
      default: {
        const handleSelect = () => {
          node.onSelect()
        }
        return (
          <parts.Item
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
            disabled={node.disabled}
            variant={node.variant}
            className={node.className}
            onClick={handleSelect}
          >
            {menuIcon(node.icon)}
            {node.label}
            {node.trailing}
          </parts.Item>
        )
      }
    }
  })

const popupNativeMenu = async ({
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

const toNativeMenu = (
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

export const AppContextMenu = ({
  items,
  children,
  open,
  onOpenChange,
  render,
  className,
  style,
  contentProps,
}: AppContextMenuProps) => {
  const [isNativeOpen, setIsNativeOpen] = useState(false)

  if (!isNativeAvailable()) {
    const resolved = typeof items === 'function' ? items() : items

    return (
      <ContextMenu open={open} onOpenChange={onOpenChange}>
        <ContextMenuTrigger className={className} style={style} render={render}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent {...contentProps}>
          {renderWebNodes(resolved, contextMenuParts)}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  const handleContextMenu = async (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isNativeOpen) {
      return
    }

    const resolved = typeof items === 'function' ? items() : items
    const { nativeItems, handlers } = toNativeMenu(resolved)

    setIsNativeOpen(true)
    onOpenChange?.(true)

    await popupNativeMenu({
      handlers,
      nativeItems,
      onClose: () => {
        setIsNativeOpen(false)
        onOpenChange?.(false)
      },
    })
  }

  const triggerProps = {
    'data-popup-open': isNativeOpen ? '' : undefined,
    onContextMenu: handleContextMenu,
  }

  if (render) {
    // oxlint-disable-next-line react/no-clone-element
    return cloneElement(render, triggerProps, children)
  }

  return (
    <div
      className={cn('select-none', className)}
      style={style}
      {...triggerProps}
    >
      {children}
    </div>
  )
}

const stopPropagation = (e: MouseEvent) => e.stopPropagation()

const defaultMenuButton = <Button variant="ghost" size="icon-xs" />

export const AppMenuButton = ({
  items,
  className,
  contentProps,
  render = defaultMenuButton,
}: Pick<AppContextMenuProps, 'items' | 'className' | 'contentProps'> & {
  render?: ReactElement<HTMLAttributes<HTMLElement>>
}) => {
  const [isNativeOpen, setIsNativeOpen] = useState(false)
  const resolve = () => (typeof items === 'function' ? items() : items)
  const icon = <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
  // oxlint-disable-next-line react/no-clone-element
  const trigger = cloneElement(render, {
    'aria-label': 'More actions',
    className: cn('text-muted-foreground', render.props.className, className),
    onClick: stopPropagation,
    onMouseDown: stopPropagation,
  })

  if (!isNativeAvailable()) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={trigger}>{icon}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" {...contentProps}>
          {renderWebNodes(resolve(), dropdownMenuParts)}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const handleClick = async (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()

    if (isNativeOpen) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const { nativeItems, handlers } = toNativeMenu(resolve())

    setIsNativeOpen(true)

    await popupNativeMenu({
      handlers,
      nativeItems,
      onClose: () => setIsNativeOpen(false),
      position: { x: rect.left, y: rect.bottom + 4 },
    })
  }

  // oxlint-disable-next-line react/no-clone-element
  return cloneElement(
    trigger,
    {
      'aria-expanded': isNativeOpen,
      'aria-haspopup': 'menu',
      onClick: handleClick,
    },
    icon
  )
}

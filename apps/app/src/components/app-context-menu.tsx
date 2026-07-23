import type { MenuPopupResult, NativeMenuNode } from '@tamery/shared/context-menu'
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
import { cn } from '@tamery/ui/lib/utils'
import type { CSSProperties, MouseEvent, ReactElement, ReactNode } from 'react'
import { cloneElement, useState } from 'react'

export interface AppMenuItem {
  type?: 'item'
  label: string
  onSelect: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive'
  /** Native only: renders a checkbox-style checkmark. Web styles via `className`/`icon`. */
  checked?: boolean
  /** Web only. */
  icon?: ReactNode
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

function isNativeAvailable(): boolean {
  return !!window.electron?.menu?.popup
}

function renderWebNodes(nodes: AppMenuNode[]): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'separator':
        // oxlint-disable-next-line react/no-array-index-key
        return <ContextMenuSeparator key={index} />
      case 'label':
        // oxlint-disable-next-line react/no-array-index-key
        return <ContextMenuLabel key={index}>{node.label}</ContextMenuLabel>
      case 'group':
        return (
          // oxlint-disable-next-line react/no-array-index-key
          <ContextMenuGroup key={index}>
            {node.label && <ContextMenuLabel>{node.label}</ContextMenuLabel>}
            {renderWebNodes(node.items)}
          </ContextMenuGroup>
        )
      case 'sub':
        return (
          // oxlint-disable-next-line react/no-array-index-key
          <ContextMenuSub key={index}>
            <ContextMenuSubTrigger disabled={node.disabled}>{node.label}</ContextMenuSubTrigger>
            <ContextMenuSubContent>{renderWebNodes(node.items)}</ContextMenuSubContent>
          </ContextMenuSub>
        )
      case 'radio':
        return (
          <ContextMenuRadioGroup
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
            value={node.value}
            onValueChange={node.onValueChange}
          >
            {node.options.map(option => (
              <ContextMenuRadioItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </ContextMenuRadioItem>
            ))}
          </ContextMenuRadioGroup>
        )
      default:
        return (
          <ContextMenuItem
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
            disabled={node.disabled}
            variant={node.variant}
            className={node.className}
            onClick={node.onSelect}
          >
            {node.icon}
            {node.label}
            {node.trailing}
          </ContextMenuItem>
        )
    }
  })
}

function toNativeMenu(nodes: AppMenuNode[]): {
  nativeItems: NativeMenuNode[]
  handlers: Map<string, () => void>
} {
  const handlers = new Map<string, () => void>()
  let counter = 0

  const walk = (input: AppMenuNode[]): NativeMenuNode[] => {
    const result: NativeMenuNode[] = []

    for (const node of input) {
      switch (node.type) {
        case 'separator':
          result.push({ type: 'separator' })
          break
        case 'label':
          result.push({ type: 'label', label: node.label })
          break
        case 'group':
          if (node.label) result.push({ type: 'label', label: node.label })
          result.push(...walk(node.items))
          break
        case 'sub':
          result.push({
            type: 'submenu',
            label: node.label,
            enabled: !node.disabled,
            items: walk(node.items),
          })
          break
        case 'radio':
          for (const option of node.options) {
            const id = `n${counter++}`
            handlers.set(id, () => node.onValueChange(option.value))
            result.push({
              type: 'item',
              id,
              label: option.label,
              enabled: !option.disabled,
              kind: 'radio',
              checked: option.value === node.value,
            })
          }
          break
        default: {
          const id = `n${counter++}`
          handlers.set(id, node.onSelect)
          result.push({
            type: 'item',
            id,
            label: node.nativeLabel ?? node.label,
            enabled: !node.disabled,
            kind: node.checked === undefined ? 'normal' : 'checkbox',
            checked: node.checked,
            accelerator: node.accelerator,
          })
        }
      }
    }

    return result
  }

  return { nativeItems: walk(nodes), handlers }
}

export function AppContextMenu({
  items,
  children,
  open,
  onOpenChange,
  render,
  className,
  style,
  contentProps,
}: AppContextMenuProps) {
  const [isNativeOpen, setIsNativeOpen] = useState(false)

  if (!isNativeAvailable()) {
    const resolved = typeof items === 'function' ? items() : items

    return (
      <ContextMenu open={open} onOpenChange={onOpenChange}>
        <ContextMenuTrigger className={className} style={style} render={render}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent {...contentProps}>{renderWebNodes(resolved)}</ContextMenuContent>
      </ContextMenu>
    )
  }

  const handleContextMenu = async (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isNativeOpen) return

    const resolved = typeof items === 'function' ? items() : items
    const { nativeItems, handlers } = toNativeMenu(resolved)

    setIsNativeOpen(true)
    onOpenChange?.(true)

    let clickedId: MenuPopupResult = null
    try {
      clickedId = await window.electron!.menu!.popup({ items: nativeItems })
    } finally {
      if (clickedId !== null) handlers.get(clickedId)?.()
      setIsNativeOpen(false)
      onOpenChange?.(false)
    }
  }

  const triggerProps = {
    'onContextMenu': handleContextMenu,
    'data-popup-open': isNativeOpen ? '' : undefined,
  }

  if (render) {
    // oxlint-disable-next-line react/no-clone-element
    return cloneElement(render, triggerProps, children)
  }

  return (
    <div className={cn('select-none', className)} style={style} {...triggerProps}>
      {children}
    </div>
  )
}

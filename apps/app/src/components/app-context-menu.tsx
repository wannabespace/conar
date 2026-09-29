import { MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@tamery/ui/components/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { cn } from '@tamery/ui/lib/utils'
import type { HTMLAttributes, MouseEvent, ReactElement } from 'react'
import { cloneElement, useState } from 'react'

import type { AppContextMenuProps } from '~/components/app-menu'
import {
  isNativeAvailable,
  popupNativeMenu,
  toNativeMenu,
} from '~/components/app-menu-native'
import {
  contextMenuParts,
  dropdownMenuParts,
  renderWebNodes,
} from '~/components/app-menu-web'

const WebContextMenuItems = ({ items }: Pick<AppContextMenuProps, 'items'>) =>
  renderWebNodes(
    typeof items === 'function' ? items() : items,
    contextMenuParts
  )

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
    return (
      <ContextMenu open={open} onOpenChange={onOpenChange}>
        <ContextMenuTrigger className={className} style={style} render={render}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent {...contentProps}>
          <WebContextMenuItems items={items} />
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
        <DropdownMenuContent
          align="end"
          onClick={stopPropagation}
          onContextMenu={stopPropagation}
          {...contentProps}
        >
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

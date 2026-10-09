import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
} from '@tamery/ui/components/command'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useHotkey } from '@tanstack/react-hotkeys'
import type { ComponentProps } from 'react'
import { useRef } from 'react'

import {
  AppContextMenu,
  openContextMenuOn,
} from '~/components/app-context-menu'

export interface RowAction {
  destructive?: boolean
  icon: IconSvgElement
  label: string
  onSelect: () => void
}

export const PopoverCommand = ({
  children,
  searchPlaceholder,
}: {
  children: React.ReactNode
  searchPlaceholder: string
}) => {
  const searchRef = useRef<HTMLInputElement>(null)

  useHotkey(
    'Mod+.',
    () => {
      const item = searchRef.current
        ?.closest('[cmdk-root]')
        ?.querySelector('[cmdk-item][data-selected="true"]')
      if (item) {
        openContextMenuOn(item)
      }
    },
    { target: searchRef }
  )

  return (
    <Command loop>
      <CommandInput ref={searchRef} placeholder={searchPlaceholder} autoFocus />
      {children}
    </Command>
  )
}

export const ListEmpty = ({
  children,
  icon,
}: {
  children: React.ReactNode
  icon: IconSvgElement
}) => (
  <CommandEmpty>
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-4 text-xs">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
      {children}
    </div>
  </CommandEmpty>
)

export const ActionItem = ({
  actions,
  children,
  ...props
}: ComponentProps<typeof CommandItem> & { actions: RowAction[] }) => {
  const itemRef = useRef<HTMLDivElement>(null)

  return (
    <AppContextMenu
      items={actions.map(({ destructive, ...action }) => ({
        ...action,
        variant: destructive ? 'destructive' : 'default',
      }))}
      contentProps={{
        finalFocus: () =>
          itemRef.current
            ?.closest('[cmdk-root]')
            ?.querySelector<HTMLElement>('[cmdk-input]')
            ?.focus(),
      }}
      render={<CommandItem ref={itemRef} {...props} />}
    >
      {children}
      <div className="flex shrink-0 items-center">
        {actions.map(({ destructive, icon, label, onSelect }) => (
          <Tooltip key={label}>
            <TooltipTrigger
              render={
                <Button
                  variant={destructive ? 'ghost-destructive' : 'ghost-muted'}
                  size="icon-xs"
                  aria-label={label}
                  tabIndex={-1}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelect()
                  }}
                />
              }
            >
              <HugeiconsIcon icon={icon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </AppContextMenu>
  )
}

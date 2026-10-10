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
import type { ComponentProps } from 'react'

import { AppContextMenu } from '~/components/app-context-menu'
import type { AppMenuItem } from '~/components/app-menu'

export const PopoverCommand = ({
  children,
  searchPlaceholder,
}: {
  children: React.ReactNode
  searchPlaceholder: string
}) => (
  <Command loop>
    <CommandInput placeholder={searchPlaceholder} autoFocus />
    {children}
  </Command>
)

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
}: ComponentProps<typeof CommandItem> & {
  actions: (AppMenuItem & { icon: IconSvgElement })[]
}) => (
  <AppContextMenu
    items={actions}
    contentProps={{
      // An action can unmount its own row, so focus returns to the search by lookup — assumes no other cmdk Command is mounted.
      finalFocus: () =>
        document.querySelector<HTMLElement>('[cmdk-input]')?.focus(),
    }}
    render={<CommandItem {...props} />}
  >
    {children}
    <div className="flex shrink-0 items-center">
      {actions.map(({ icon, label, onSelect, variant }) => (
        <Tooltip key={label}>
          <TooltipTrigger
            render={
              <Button
                variant={
                  variant === 'destructive'
                    ? 'ghost-destructive'
                    : 'ghost-muted'
                }
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

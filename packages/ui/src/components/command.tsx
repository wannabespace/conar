import { RiCheckLine, RiSearchLine } from '@remixicon/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { InputGroup, InputGroupAddon } from '@tamery/ui/components/input-group'
import { cn } from '@tamery/ui/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'
import * as React from 'react'

export { Command as CommandPrimitive, defaultFilter } from 'cmdk'

export const Command = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) => (
  <CommandPrimitive
    data-slot="command"
    className={cn(
      `bg-popover text-popover-foreground flex size-full flex-col overflow-hidden rounded-xl p-1`,
      className
    )}
    {...props}
  />
)

export const CommandDialog = ({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, 'children'> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) => (
  <Dialog {...props}>
    <DialogHeader className="sr-only">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogContent
      animated={false}
      className={cn(
        `top-[16svh] flex max-h-[min(35rem,calc(84svh-2rem))] translate-y-0 flex-col gap-0 overflow-hidden rounded-3xl! p-0 sm:max-w-xl`,
        className
      )}
      showCloseButton={showCloseButton}
    >
      {children}
    </DialogContent>
  </Dialog>
)

export const CommandInput = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) => (
  <div data-slot="command-input-wrapper" className="p-1 pb-0">
    <InputGroup className="h-8! bg-[color-mix(in_oklch,var(--input),var(--foreground)_4%)]">
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          `w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50`,
          className
        )}
        {...props}
      />
      <InputGroupAddon>
        <RiSearchLine className="size-4 shrink-0 opacity-50" />
      </InputGroupAddon>
    </InputGroup>
  </div>
)

export const CommandList = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) => (
  <CommandPrimitive.List
    data-slot="command-list"
    className={cn(
      `no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none`,
      className
    )}
    {...props}
  />
)

export const CommandEmpty = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) => (
  <CommandPrimitive.Empty
    data-slot="command-empty"
    className={cn('py-6 text-center text-sm', className)}
    {...props}
  />
)

export const CommandGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) => (
  <CommandPrimitive.Group
    data-slot="command-group"
    className={cn(
      `text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium`,
      className
    )}
    {...props}
  />
)

export const CommandSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) => (
  <CommandPrimitive.Separator
    data-slot="command-separator"
    className={cn('bg-border/50 my-1 h-px', className)}
    {...props}
  />
)

export const CommandItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) => (
  <CommandPrimitive.Item
    data-slot="command-item"
    className={cn(
      `group/command-item data-selected:bg-accent data-selected:text-accent-foreground data-selected:*:[svg]:text-foreground relative flex min-h-7 cursor-default items-center gap-2 rounded-md px-2 py-1 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-2xl data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
      className
    )}
    {...props}
  >
    {children}
    <RiCheckLine className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
  </CommandPrimitive.Item>
)

export const CommandShortcut = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    data-slot="command-shortcut"
    className={cn(
      `text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest`,
      className
    )}
    {...props}
  />
)

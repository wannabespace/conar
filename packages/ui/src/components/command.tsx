import { Search01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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

const commandVariants = {
  // A command list living in a flat pane owns no surface of its own
  flat: 'text-foreground',
  // A floating popup's own rounded surface
  popup: 'bg-popover text-popover-foreground rounded-xl',
}

export const Command = ({
  className,
  variant = 'popup',
  ...props
}: React.ComponentProps<typeof CommandPrimitive> & {
  variant?: keyof typeof commandVariants
}) => (
  <CommandPrimitive
    data-slot="command"
    className={cn(
      'flex size-full flex-col overflow-hidden',
      commandVariants[variant],
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

const commandInputVariants = {
  // A full-bleed row for a command list living in a flat pane, hairline along the
  // bottom only; the extra px-1 lands the icon on the pane's own px-3 text column
  flat: {
    group: `h-9! rounded-none border-0 border-b bg-transparent px-1 shadow-none ring-0`,
    wrapper: '',
  },
  // A filled pill inset from a floating popup's own padding
  pill: {
    group: `h-7! rounded-lg bg-[color-mix(in_oklch,var(--input),var(--foreground)_4%)]`,
    wrapper: 'p-1 pb-0',
  },
}

export const CommandInput = ({
  className,
  variant = 'pill',
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  variant?: keyof typeof commandInputVariants
}) => (
  <div
    data-slot="command-input-wrapper"
    className={commandInputVariants[variant].wrapper}
  >
    <InputGroup className={commandInputVariants[variant].group}>
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          `w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50`,
          className
        )}
        {...props}
      />
      <InputGroupAddon>
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="size-4 shrink-0 opacity-50"
        />
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
    className={cn('py-4 text-center text-sm', className)}
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
      `group/command-item data-selected:bg-accent data-selected:text-accent-foreground *:[svg]:text-foreground/70 data-selected:*:[svg]:text-foreground relative flex min-h-7 cursor-default items-center gap-2 rounded-lg px-2 py-1 text-sm font-[450] tracking-wide outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
      className
    )}
    {...props}
  >
    {children}
    <HugeiconsIcon
      icon={Tick02Icon}
      strokeWidth={2}
      className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100"
    />
  </CommandPrimitive.Item>
)

export const CommandShortcut = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    data-slot="command-shortcut"
    className={cn(
      `text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs`,
      className
    )}
    {...props}
  />
)

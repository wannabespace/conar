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

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        `
          flex size-full flex-col overflow-hidden rounded-xl bg-popover p-1
          text-popover-foreground
        `,
        className,
      )}
      {...props}
    />
  )
}

function CommandDialog({
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
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          `
            top-[16svh] flex max-h-[min(35rem,calc(84svh-2rem))] translate-y-0
            flex-col gap-0 overflow-hidden rounded-3xl! p-0
            sm:max-w-xl
            data-open:animate-none
            data-closed:animate-none
          `,
          className,
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8! bg-[color-mix(in_oklch,var(--input),var(--foreground)_4%)]">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            `
              w-full text-sm outline-hidden
              disabled:cursor-not-allowed disabled:opacity-50
            `,
            className,
          )}
          {...props}
        />
        <InputGroupAddon>
          <RiSearchLine className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        `
          no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto
          outline-none
        `,
        className,
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm', className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        `
          overflow-hidden p-1 text-foreground
          **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1
          **:[[cmdk-group-heading]]:text-xs
          **:[[cmdk-group-heading]]:font-medium
          **:[[cmdk-group-heading]]:text-muted-foreground
        `,
        className,
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('my-1 h-px bg-border/50', className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        `
          group/command-item relative flex min-h-7 cursor-default items-center
          gap-2 rounded-md px-2 py-1 text-sm outline-hidden select-none
          in-data-[slot=dialog-content]:rounded-2xl
          data-[disabled=true]:pointer-events-none
          data-[disabled=true]:opacity-50
          data-selected:bg-accent/60 data-selected:text-accent-foreground
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          [&_svg:not([class*='size-'])]:size-4
          data-selected:*:[svg]:text-foreground
        `,
        className,
      )}
      {...props}
    >
      {children}
      <RiCheckLine
        className="
        ml-auto opacity-0
        group-has-data-[slot=command-shortcut]/command-item:hidden
        group-data-[checked=true]/command-item:opacity-100
      "
      />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        `
          ml-auto text-xs tracking-widest text-muted-foreground
          group-data-selected/command-item:text-foreground
        `,
        className,
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  // Unstyled cmdk root/parts for custom compositions (e.g. inline filter fields)
  CommandPrimitive,
  CommandSeparator,
  CommandShortcut,
}

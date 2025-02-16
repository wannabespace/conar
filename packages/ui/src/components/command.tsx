import type { DialogProps } from '@radix-ui/react-dialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@connnect/ui/components/dialog'
import { cn } from '@connnect/ui/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import * as React from 'react'

function Command({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive> & { ref?: React.RefObject<React.ComponentRef<typeof CommandPrimitive>> }) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-background text-foreground',
        className,
      )}
      {...props}
    />
  )
}
Command.displayName = CommandPrimitive.displayName

function CommandDialog({ children, ...props }: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogDescription />
      <DialogTitle />
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & { ref?: React.RefObject<React.ComponentRef<typeof CommandPrimitive.Input>> }) {
  return (
    <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
      <Search className="mr-2 size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  )
}

CommandInput.displayName = CommandPrimitive.Input.displayName

function CommandList({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> & { ref?: React.RefObject<React.ComponentRef<typeof CommandPrimitive.List>> }) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
      {...props}
    />
  )
}

CommandList.displayName = CommandPrimitive.List.displayName

function CommandEmpty({ ref, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & { ref?: React.RefObject<React.ComponentRef<typeof CommandPrimitive.Empty>> }) {
  return (
    <CommandPrimitive.Empty
      ref={ref}
      className="py-6 text-center text-sm"
      {...props}
    />
  )
}

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

function CommandGroup({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & { ref?: React.RefObject<React.ComponentRef<typeof CommandPrimitive.Group>> }) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

CommandGroup.displayName = CommandPrimitive.Group.displayName

function CommandSeparator({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> & { ref?: React.RefObject<React.ComponentRef<typeof CommandPrimitive.Separator>> }) {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  )
}
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

function CommandItem({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & { ref?: React.RefObject<React.ComponentRef<typeof CommandPrimitive.Item>> }) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  )
}

CommandItem.displayName = CommandPrimitive.Item.displayName

function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = 'CommandShortcut'

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
}

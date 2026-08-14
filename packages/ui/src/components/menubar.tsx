import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { Menubar as MenubarPrimitive } from '@base-ui/react/menubar'
import { RiCheckLine } from '@remixicon/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const Menubar = ({ className, ...props }: MenubarPrimitive.Props) => (
  <MenubarPrimitive
    data-slot="menubar"
    className={cn('flex h-8 items-center rounded-2xl border p-0.75', className)}
    {...props}
  />
)

const MenubarMenu = ({
  ...props
}: React.ComponentProps<typeof DropdownMenu>) => (
  <DropdownMenu data-slot="menubar-menu" {...props} />
)

const MenubarGroup = ({
  ...props
}: React.ComponentProps<typeof DropdownMenuGroup>) => (
  <DropdownMenuGroup data-slot="menubar-group" {...props} />
)

const MenubarPortal = ({
  ...props
}: React.ComponentProps<typeof DropdownMenuPortal>) => (
  <DropdownMenuPortal data-slot="menubar-portal" {...props} />
)

const MenubarTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuTrigger>) => (
  <DropdownMenuTrigger
    data-slot="menubar-trigger"
    className={cn(
      `hover:bg-accent aria-expanded:bg-muted flex items-center rounded-2xl px-1.5 py-0.5 text-sm font-medium outline-hidden select-none`,
      className
    )}
    {...props}
  />
)

const MenubarContent = ({
  className,
  align = 'start',
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) => (
  <DropdownMenuContent
    data-slot="menubar-content"
    align={align}
    alignOffset={alignOffset}
    sideOffset={sideOffset}
    className={cn(
      `bg-popover/70 text-popover-foreground ring-foreground/4 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:focus:data-[slot$=-item]:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:focus:data-[slot$=-trigger]:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:**:text-accent-foreground! **:data-[variant=destructive]:text-accent-foreground! **:focus:data-[variant=destructive]:bg-foreground/10! data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 relative min-w-36 animate-none! rounded-2xl p-1 shadow-lg ring-1 duration-100 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150`,
      className
    )}
    {...props}
  />
)

const MenubarItem = ({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) => (
  <DropdownMenuItem
    data-slot="menubar-item"
    data-inset={inset}
    data-variant={variant}
    className={cn(
      `group/menubar-item focus:bg-accent/60 focus:text-accent-foreground focus:not-data-[variant=destructive]:**:text-accent-foreground data-[variant=destructive]:text-destructive focus:data-[variant=destructive]:bg-destructive/15 focus:data-[variant=destructive]:text-destructive *:[svg]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive! min-h-7 gap-2 rounded-xl px-2 py-1.5 text-sm data-disabled:opacity-50 data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4`,
      className
    )}
    {...props}
  />
)

const MenubarCheckboxItem = ({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) => (
  <MenuPrimitive.CheckboxItem
    data-slot="menubar-checkbox-item"
    data-inset={inset}
    className={cn(
      `focus:bg-accent/60 focus:text-accent-foreground focus:**:text-accent-foreground relative flex min-h-7 cursor-default items-center gap-2 rounded-xl py-1.5 pr-1.5 pl-7 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="pointer-events-none absolute left-1.5 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
      <MenuPrimitive.CheckboxItemIndicator>
        <RiCheckLine />
      </MenuPrimitive.CheckboxItemIndicator>
    </span>
    {children}
  </MenuPrimitive.CheckboxItem>
)

const MenubarRadioGroup = ({
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioGroup>) => (
  <DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />
)

const MenubarRadioItem = ({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) => (
  <MenuPrimitive.RadioItem
    data-slot="menubar-radio-item"
    data-inset={inset}
    className={cn(
      `focus:bg-accent/60 focus:text-accent-foreground focus:**:text-accent-foreground *:[svg]:text-muted-foreground relative flex min-h-7 cursor-default items-center gap-2 rounded-xl py-1.5 pr-1.5 pl-7 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
      className
    )}
    {...props}
  >
    <span className="pointer-events-none absolute left-1.5 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
      <MenuPrimitive.RadioItemIndicator>
        <RiCheckLine />
      </MenuPrimitive.RadioItemIndicator>
    </span>
    {children}
  </MenuPrimitive.RadioItem>
)

const MenubarLabel = ({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabel> & {
  inset?: boolean
}) => (
  <DropdownMenuLabel
    data-slot="menubar-label"
    data-inset={inset}
    className={cn(
      `text-muted-foreground px-2 py-1 text-sm data-inset:pl-7`,
      className
    )}
    {...props}
  />
)

const MenubarSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparator>) => (
  <DropdownMenuSeparator
    data-slot="menubar-separator"
    className={cn('bg-border/50 -mx-1 my-1 h-px', className)}
    {...props}
  />
)

const MenubarShortcut = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuShortcut>) => (
  <DropdownMenuShortcut
    data-slot="menubar-shortcut"
    className={cn(
      `text-muted-foreground group-focus/menubar-item:text-accent-foreground ml-auto text-xs tracking-widest`,
      className
    )}
    {...props}
  />
)

const MenubarSub = ({
  ...props
}: React.ComponentProps<typeof DropdownMenuSub>) => (
  <DropdownMenuSub data-slot="menubar-sub" {...props} />
)

const MenubarSubTrigger = ({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubTrigger> & {
  inset?: boolean
}) => (
  <DropdownMenuSubTrigger
    data-slot="menubar-sub-trigger"
    data-inset={inset}
    className={cn(
      `focus:bg-accent/60 focus:text-accent-foreground data-open:bg-accent/60 data-open:text-accent-foreground *:[svg]:text-muted-foreground min-h-7 gap-2 rounded-xl px-2 py-1.5 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4`,
      className
    )}
    {...props}
  />
)

const MenubarSubContent = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubContent>) => (
  <DropdownMenuSubContent
    data-slot="menubar-sub-content"
    className={cn(
      `bg-popover/70 text-popover-foreground ring-foreground/4 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:focus:data-[slot$=-item]:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:focus:data-[slot$=-trigger]:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:**:text-accent-foreground! **:data-[variant=destructive]:text-accent-foreground! **:focus:data-[variant=destructive]:bg-foreground/10! data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 relative min-w-32 animate-none! rounded-2xl p-1 shadow-lg ring-1 duration-100 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150`,
      className
    )}
    {...props}
  />
)

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
}

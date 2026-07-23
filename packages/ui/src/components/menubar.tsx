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

function Menubar({ className, ...props }: MenubarPrimitive.Props) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      className={cn('flex h-8 items-center rounded-2xl border p-0.75', className)}
      {...props}
    />
  )
}

function MenubarMenu({ ...props }: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({ ...props }: React.ComponentProps<typeof DropdownMenuGroup>) {
  return <DropdownMenuGroup data-slot="menubar-group" {...props} />
}

function MenubarPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPortal>) {
  return <DropdownMenuPortal data-slot="menubar-portal" {...props} />
}

function MenubarTrigger({ className, ...props }: React.ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      data-slot="menubar-trigger"
      className={cn(
        `
          flex items-center rounded-2xl px-1.5 py-0.5 text-sm font-medium
          outline-hidden select-none
          hover:bg-accent
          aria-expanded:bg-muted
        `,
        className,
      )}
      {...props}
    />
  )
}

function MenubarContent({
  className,
  align = 'start',
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(
        `
        relative min-w-36 animate-none! rounded-2xl bg-popover/70 p-1
        text-popover-foreground shadow-lg ring-1 ring-foreground/4 duration-100
        before:pointer-events-none before:absolute before:inset-0 before:-z-1
        before:rounded-[inherit] before:backdrop-blur-2xl
        before:backdrop-saturate-150
        data-[side=bottom]:slide-in-from-top-2
        data-[side=inline-end]:slide-in-from-left-2
        data-[side=inline-start]:slide-in-from-right-2
        data-[side=left]:slide-in-from-right-2
        data-[side=right]:slide-in-from-left-2
        data-[side=top]:slide-in-from-bottom-2
        **:focus:data-[slot$=-item]:bg-foreground/10
        **:data-[slot$=-item]:data-highlighted:bg-foreground/10
        **:data-[slot$=-separator]:bg-foreground/5
        **:focus:data-[slot$=-trigger]:bg-foreground/10
        **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10!
        **:data-[variant=destructive]:**:text-accent-foreground!
        **:data-[variant=destructive]:text-accent-foreground!
        **:focus:data-[variant=destructive]:bg-foreground/10!
        data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
      `,
        className,
      )}
      {...props}
    />
  )
}

function MenubarItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        `
          group/menubar-item min-h-7 gap-2 rounded-xl px-2 py-1.5 text-sm
          focus:bg-accent/60 focus:text-accent-foreground
          focus:not-data-[variant=destructive]:**:text-accent-foreground
          data-inset:pl-7
          data-[variant=destructive]:text-destructive
          focus:data-[variant=destructive]:bg-destructive/15
          focus:data-[variant=destructive]:text-destructive
          data-disabled:opacity-50
          [&_svg:not([class*='size-'])]:size-4
          data-[variant=destructive]:*:[svg]:text-destructive!
        `,
        className,
      )}
      {...props}
    />
  )
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={cn(
        `
          relative flex min-h-7 cursor-default items-center gap-2 rounded-xl
          py-1.5 pr-1.5 pl-7 text-sm outline-hidden select-none
          focus:bg-accent/60 focus:text-accent-foreground
          focus:**:text-accent-foreground
          data-inset:pl-7
          data-disabled:pointer-events-none data-disabled:opacity-50
          [&_svg]:pointer-events-none [&_svg]:shrink-0
        `,
        className,
      )}
      checked={checked}
      {...props}
    >
      <span
        className="
        pointer-events-none absolute left-1.5 flex size-4 items-center
        justify-center
        [&_svg:not([class*='size-'])]:size-4
      "
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <RiCheckLine />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function MenubarRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuRadioGroup>) {
  return <DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />
}

function MenubarRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menubar-radio-item"
      data-inset={inset}
      className={cn(
        `
          relative flex min-h-7 cursor-default items-center gap-2 rounded-xl
          py-1.5 pr-1.5 pl-7 text-sm outline-hidden select-none
          focus:bg-accent/60 focus:text-accent-foreground
          focus:**:text-accent-foreground
          data-inset:pl-7
          data-disabled:pointer-events-none data-disabled:opacity-50
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          [&_svg:not([class*='size-'])]:size-4
        `,
        className,
      )}
      {...props}
    >
      <span
        className="
        pointer-events-none absolute left-1.5 flex size-4 items-center
        justify-center
        [&_svg:not([class*='size-'])]:size-4
      "
      >
        <MenuPrimitive.RadioItemIndicator>
          <RiCheckLine />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabel> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuLabel
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        `
          px-2 py-1 text-sm text-muted-foreground
          data-inset:pl-7
        `,
        className,
      )}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator
      data-slot="menubar-separator"
      className={cn('-mx-1 my-1 h-px bg-border/50', className)}
      {...props}
    />
  )
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuShortcut>) {
  return (
    <DropdownMenuShortcut
      data-slot="menubar-shortcut"
      className={cn(
        `
          ml-auto text-xs tracking-widest text-muted-foreground
          group-focus/menubar-item:text-accent-foreground
        `,
        className,
      )}
      {...props}
    />
  )
}

function MenubarSub({ ...props }: React.ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuSubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        `
          min-h-7 gap-2 rounded-xl px-2 py-1.5 text-sm
          focus:bg-accent/60 focus:text-accent-foreground
          data-inset:pl-7
          data-open:bg-accent/60 data-open:text-accent-foreground
          [&_svg:not([class*='size-'])]:size-4
        `,
        className,
      )}
      {...props}
    />
  )
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubContent>) {
  return (
    <DropdownMenuSubContent
      data-slot="menubar-sub-content"
      className={cn(
        `
        relative min-w-32 animate-none! rounded-2xl bg-popover/70 p-1
        text-popover-foreground shadow-lg ring-1 ring-foreground/4 duration-100
        before:pointer-events-none before:absolute before:inset-0 before:-z-1
        before:rounded-[inherit] before:backdrop-blur-2xl
        before:backdrop-saturate-150
        data-[side=bottom]:slide-in-from-top-2
        data-[side=left]:slide-in-from-right-2
        data-[side=right]:slide-in-from-left-2
        data-[side=top]:slide-in-from-bottom-2
        **:focus:data-[slot$=-item]:bg-foreground/10
        **:data-[slot$=-item]:data-highlighted:bg-foreground/10
        **:data-[slot$=-separator]:bg-foreground/5
        **:focus:data-[slot$=-trigger]:bg-foreground/10
        **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10!
        **:data-[variant=destructive]:**:text-accent-foreground!
        **:data-[variant=destructive]:text-accent-foreground!
        **:focus:data-[variant=destructive]:bg-foreground/10!
        data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
        data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
      `,
        className,
      )}
      {...props}
    />
  )
}

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

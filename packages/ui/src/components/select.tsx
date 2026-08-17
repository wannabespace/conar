import { Select as SelectPrimitive } from '@base-ui/react/select'
import { RiArrowDownSLine, RiArrowUpSLine, RiCheckLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

type SelectSize = 'xs' | 'sm' | 'default'

const Select = SelectPrimitive.Root

const SelectGroup = ({ className, ...props }: SelectPrimitive.Group.Props) => (
  <SelectPrimitive.Group
    data-slot="select-group"
    className={cn('scroll-my-1.5 p-1', className)}
    {...props}
  />
)

const SelectValue = ({ className, ...props }: SelectPrimitive.Value.Props) => (
  <SelectPrimitive.Value
    data-slot="select-value"
    className={cn('flex flex-1 text-left', className)}
    {...props}
  />
)

const SelectTrigger = ({
  className,
  size = 'default',
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: SelectSize
}) => (
  <SelectPrimitive.Trigger
    data-slot="select-trigger"
    data-size={size}
    className={cn(
      `bg-input ring-foreground/4 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive/60 aria-invalid:ring-destructive/30 data-placeholder:text-muted-foreground flex w-fit items-center justify-between gap-1.5 rounded-xl border border-transparent px-3 text-sm whitespace-nowrap shadow-xs ring-[0.5px] transition-shadow duration-200 outline-none hover:bg-[color-mix(in_oklch,var(--input),var(--foreground)_3%)] focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 data-popup-open:bg-[color-mix(in_oklch,var(--input),var(--foreground)_3%)] data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-lg data-[size=xs]:h-6 data-[size=xs]:gap-1 data-[size=xs]:rounded-md data-[size=xs]:px-2.5 data-[size=xs]:text-xs *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 *:data-[slot=select-value]:overflow-hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[size=xs]:[&_svg:not([class*='size-'])]:size-3`,
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon
      render={
        <RiArrowDownSLine className="text-muted-foreground pointer-events-none size-4" />
      }
    />
  </SelectPrimitive.Trigger>
)

const SelectScrollUpButton = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) => (
  <SelectPrimitive.ScrollUpArrow
    data-slot="select-scroll-up-button"
    className={cn(
      `bg-popover top-0 z-10 flex w-full cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4`,
      className
    )}
    {...props}
  >
    <RiArrowUpSLine />
  </SelectPrimitive.ScrollUpArrow>
)

const SelectScrollDownButton = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) => (
  <SelectPrimitive.ScrollDownArrow
    data-slot="select-scroll-down-button"
    className={cn(
      `bg-popover bottom-0 z-10 flex w-full cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4`,
      className
    )}
    {...props}
  >
    <RiArrowDownSLine />
  </SelectPrimitive.ScrollDownArrow>
)

const SelectContent = ({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  alignItemWithTrigger = true,
  size = 'default',
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'
  > & { size?: SelectSize }) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Positioner
      side={side}
      sideOffset={sideOffset}
      align={align}
      alignOffset={alignOffset}
      alignItemWithTrigger={alignItemWithTrigger}
      className="isolate z-50"
    >
      <SelectPrimitive.Popup
        data-slot="select-content"
        data-align-trigger={alignItemWithTrigger}
        data-size={size}
        className={cn(
          `bg-popover text-popover-foreground ring-foreground/4 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 relative isolate z-50 max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl shadow-lg ring-1 duration-100 data-[align-trigger=true]:animate-none data-[size=xs]:rounded-lg`,
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
        <SelectScrollDownButton />
      </SelectPrimitive.Popup>
    </SelectPrimitive.Positioner>
  </SelectPrimitive.Portal>
)

const SelectLabel = ({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) => (
  <SelectPrimitive.GroupLabel
    data-slot="select-label"
    className={cn('text-muted-foreground px-2 py-1 text-xs', className)}
    {...props}
  />
)

const SelectItem = ({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) => (
  <SelectPrimitive.Item
    data-slot="select-item"
    className={cn(
      `focus:bg-accent focus:text-accent-foreground focus:not-data-[variant=destructive]:**:text-accent-foreground relative flex min-h-7 w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none in-data-[size=xs]:min-h-6 in-data-[size=xs]:gap-1.5 in-data-[size=xs]:rounded-sm in-data-[size=xs]:py-1 in-data-[size=xs]:pr-7 in-data-[size=xs]:text-xs data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 in-data-[size=xs]:[&_svg:not([class*='size-'])]:size-3 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2`,
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="flex min-w-0 flex-1 gap-2 truncate">
      {children}
    </SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator
      render={
        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
      }
    >
      <RiCheckLine className="pointer-events-none" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
)

const SelectSeparator = ({
  className,
  ...props
}: SelectPrimitive.Separator.Props) => (
  <SelectPrimitive.Separator
    data-slot="select-separator"
    className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
    {...props}
  />
)

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

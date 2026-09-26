import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const Popover = ({ ...props }: PopoverPrimitive.Root.Props) => (
  <PopoverPrimitive.Root data-slot="popover" {...props} />
)

const createPopoverHandle = PopoverPrimitive.createHandle

const PopoverTrigger = ({ ...props }: PopoverPrimitive.Trigger.Props) => (
  <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
)

const PopoverContent = ({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  padding = 'default',
  detached = false,
  children,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  > & {
    padding?: 'default' | 'none'
    /** Only for popovers opened through `createPopoverHandle`. */
    detached?: boolean
  }) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Positioner
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      className={cn(
        'isolate z-50',
        detached &&
          'h-(--positioner-height) w-(--positioner-width) transition-[top,left,right,bottom] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]'
      )}
    >
      <PopoverPrimitive.Popup
        data-slot="popover-content"
        className={cn(
          `bg-background text-foreground ring-foreground/4 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 flex w-72 origin-(--transform-origin) flex-col rounded-xl text-sm shadow-xl ring outline-hidden ease-[cubic-bezier(0.32,0.72,0,1)] data-closed:duration-100 data-open:duration-150`,
          padding === 'default' && 'gap-4 p-4',
          detached &&
            'h-(--popup-height,auto) w-(--popup-width,auto) transition-[width,height] duration-300 data-instant:transition-none',
          className
        )}
        {...props}
      >
        {detached ? (
          <PopoverPrimitive.Viewport className="relative size-full overflow-clip *:transition-[opacity,translate] *:duration-200 *:ease-[cubic-bezier(0.32,0.72,0,1)] data-instant:*:transition-none *:data-previous:w-(--popup-width) [&>[data-current][data-starting-style]]:opacity-0 [&>[data-previous]]:absolute [&>[data-previous]]:top-0 [&>[data-previous]]:left-0 [&>[data-previous][data-ending-style]]:opacity-0 [&[data-activation-direction~=left]>[data-current][data-starting-style]]:-translate-x-3 [&[data-activation-direction~=left]>[data-previous][data-ending-style]]:translate-x-3 [&[data-activation-direction~=right]>[data-current][data-starting-style]]:translate-x-3 [&[data-activation-direction~=right]>[data-previous][data-ending-style]]:-translate-x-3">
            {children}
          </PopoverPrimitive.Viewport>
        ) : (
          children
        )}
      </PopoverPrimitive.Popup>
    </PopoverPrimitive.Positioner>
  </PopoverPrimitive.Portal>
)

const PopoverHeader = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="popover-header"
    className={cn('flex flex-col gap-1 text-sm', className)}
    {...props}
  />
)

const PopoverTitle = ({
  className,
  ...props
}: PopoverPrimitive.Title.Props) => (
  <PopoverPrimitive.Title
    data-slot="popover-title"
    className={cn('text-base font-medium', className)}
    {...props}
  />
)

const PopoverDescription = ({
  className,
  ...props
}: PopoverPrimitive.Description.Props) => (
  <PopoverPrimitive.Description
    data-slot="popover-description"
    className={cn('text-muted-foreground', className)}
    {...props}
  />
)

export {
  createPopoverHandle,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}

import type { RefObject } from 'react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui-components/react/scroll-area'
import { cn } from '@conar/ui/lib/utils'

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('group/scroll-area', className)}
      {...props}
    >
      {children}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollViewport({
  ref,
  className,
  ...props
}: ScrollAreaPrimitive.Viewport.Props & { ref?: RefObject<HTMLDivElement | null> }) {
  return (
    <ScrollAreaPrimitive.Viewport
      ref={ref}
      data-slot="scroll-area-viewport"
      className={cn(
        'focus-visible:ring-ring/50 size-full overscroll-contain transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1',
        className,
      )}
      {...props}
    />
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-[colors,width,height] select-none',
        orientation === 'vertical' && 'h-full w-1.5 hover:w-2 border-l border-l-transparent',
        orientation === 'horizontal' && 'h-1.5 hover:h-2 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="z-20 duration-150 transition-colors bg-transparent group-hover/scroll-area:bg-accent/60 relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar, ScrollViewport }

import { cn } from '@conar/ui/lib/utils'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import * as React from 'react'

type ScrollAreaProps
  = ScrollAreaPrimitive.ScrollAreaProps & {
    ref?: React.Ref<HTMLDivElement>
  }

function ScrollArea({
  ref,
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      data-slot="scroll-area"
      className={cn('group/scroll-area overflow-hidden', className)}
      {...props}
    >
      {children}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

type ScrollViewportProps
  = ScrollAreaPrimitive.ScrollAreaViewportProps & {
    ref?: React.Ref<HTMLDivElement>
  }

function ScrollViewport({
  ref,
  className,
  ...props
}: ScrollViewportProps) {
  return (
    <ScrollAreaPrimitive.Viewport
      ref={ref}
      data-slot="scroll-area-viewport"
      className={cn(
        'size-full overscroll-contain transition-[color,box-shadow] outline-none',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-1',
        className,
      )}
      {...props}
    />
  )
}

type ScrollBarProps
  = ScrollAreaPrimitive.ScrollAreaScrollbarProps & {
    ref?: React.Ref<HTMLDivElement>
  }

function ScrollBar({
  ref,
  className,
  orientation = 'vertical',
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      ref={ref}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-[colors,width,height] select-none',
        orientation === 'vertical'
        && 'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal'
        && 'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={`
          relative z-20 flex-1 rounded-full bg-transparent transition-colors
          duration-150
          group-hover/scroll-area:bg-accent/60
        `}
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar, ScrollViewport }

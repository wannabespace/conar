import type { RefObject } from 'react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { cn } from '@conar/ui/lib/utils'
import { motion } from 'motion/react'

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

export const MotionScrollViewport = motion.create(ScrollViewport)

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
        `
          size-full overscroll-contain transition-[color,box-shadow]
          outline-none
          focus-visible:ring-[3px] focus-visible:ring-ring/50
          focus-visible:outline-1
        `,
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
        orientation === 'vertical' && `
          h-full w-2.5 border-l border-l-transparent
        `,
        orientation === 'horizontal' && `
          h-2.5 flex-col border-t border-t-transparent
        `,
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="
          relative z-20 flex-1 rounded-full bg-transparent transition-colors
          duration-150
          group-hover/scroll-area:bg-accent/60
        "
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar, ScrollViewport }

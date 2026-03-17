import type { ComponentProps, RefObject } from 'react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { cn } from '@conar/ui/lib/utils'
import { motion } from 'motion/react'
import { useSubscription } from 'seitu/react'
import { createScrollState } from 'seitu/web'

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
const typeClasses = {
  card: {
    after: 'after:from-card',
    before: 'before:from-card',
  },
}

export function ScrollAreaShadow({
  type,
  className,
  viewportRef,
  ...props
}: ComponentProps<typeof ScrollArea> & { type: keyof typeof typeClasses, viewportRef: RefObject<HTMLDivElement | null> }) {
  const scroll = useSubscription(() => createScrollState({
    element: () => viewportRef.current,
    threshold: 5,
    direction: 'vertical',
  }))

  return (
    <ScrollArea
      className={cn(
        'relative',
        `
          before:pointer-events-none before:absolute before:inset-x-0
          before:top-0 before:z-10 before:h-4 before:bg-linear-to-b
          before:to-transparent
        `,
        !scroll.top.reached && typeClasses[type].before,
        `
          after:pointer-events-none after:absolute after:inset-x-0
          after:bottom-0 after:z-10 after:h-4 after:bg-linear-to-t
          after:to-transparent
        `,
        !scroll.bottom.reached && typeClasses[type].after,
        className,
      )}
      {...props}
    />
  )
}

export const ScrollViewportMotion = motion.create(ScrollViewport)

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

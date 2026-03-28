import type * as React from 'react'
import type { RefObject } from 'react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { cn } from '@conar/ui/lib/utils'

export function ScrollArea({
  scrollRef,
  className,
  children,
  scrollFade = false,
  scrollbarGutter = false,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  scrollRef?: RefObject<HTMLDivElement | null>
  scrollFade?: boolean
  scrollbarGutter?: boolean
}): React.ReactElement {
  return (
    <ScrollAreaPrimitive.Root
      className={cn('size-full min-h-0', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={scrollRef}
        className={cn(
          `
            h-full rounded-[inherit] transition-all outline-none
            focus-visible:ring-2 focus-visible:ring-ring
            focus-visible:ring-offset-1 focus-visible:ring-offset-background
            data-has-overflow-x:overscroll-x-contain
            data-has-overflow-y:overscroll-y-contain
          `,
          scrollFade
          && `
            mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))]
            mask-r-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-end)))]
            mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))]
            mask-l-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-start)))]
            [--fade-size:1.5rem]
          `,
          scrollbarGutter
          && `
            data-has-overflow-x:pb-2.5
            data-has-overflow-y:pe-2.5
          `,
        )}
        data-slot="scroll-area-viewport"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  )
}

export function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props): React.ReactElement {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        `
          m-1 flex opacity-0 transition-opacity delay-300
          data-hovering:opacity-100 data-hovering:delay-0
          data-hovering:duration-100
          data-scrolling:opacity-100 data-scrolling:delay-0
          data-scrolling:duration-100
          data-[orientation=horizontal]:h-1.5
          data-[orientation=horizontal]:flex-col
          data-[orientation=vertical]:w-1.5
        `,
        className,
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="relative flex-1 rounded-full bg-foreground/20"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollAreaPrimitive }

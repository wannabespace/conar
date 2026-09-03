import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'
import { useState } from 'react'

export const ResizeHandle = ({
  getValue,
  onResize,
  min = 0,
  className,
  ...props
}: {
  getValue: () => number
  onResize: (value: number) => void
  min?: number
} & Omit<ComponentProps<'div'>, 'onResize'>) => {
  const [start, setStart] = useState<{ x: number; value: number }>()

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- interactive resize handle
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      data-resizing={start ? true : undefined}
      className={cn(
        'group/resize-handle cursor-col-resize touch-none select-none',
        className
      )}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        setStart({ value: getValue(), x: event.clientX })
      }}
      onPointerMove={(event) => {
        if (start) {
          onResize(Math.max(min, start.value + event.clientX - start.x))
        }
      }}
      onPointerUp={() => setStart(undefined)}
      {...props}
    />
  )
}

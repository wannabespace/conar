import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'
import { useRef } from 'react'

export const ResizeHandle = ({
  getValue,
  onResize,
  onResizeEnd,
  min = 0,
  className,
  ...props
}: {
  getValue: () => number
  onResize: (value: number) => void
  onResizeEnd?: (value: number) => void
  min?: number
} & Omit<ComponentProps<'div'>, 'onResize'>) => {
  const start = useRef<{ x: number; value: number } | null>(null)

  const valueAt = (clientX: number) =>
    start.current
      ? Math.max(min, start.current.value + clientX - start.current.x)
      : null

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- interactive resize handle
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      className={cn(
        'group/resize-handle cursor-col-resize touch-none select-none',
        className
      )}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.dataset.resizing = 'true'
        start.current = { value: getValue(), x: event.clientX }
      }}
      onPointerMove={(event) => {
        const value = valueAt(event.clientX)

        if (value !== null) {
          onResize(value)
        }
      }}
      onPointerUp={(event) => {
        const value = valueAt(event.clientX)

        start.current = null
        delete event.currentTarget.dataset.resizing

        if (value !== null) {
          onResizeEnd?.(value)
        }
      }}
      {...props}
    />
  )
}

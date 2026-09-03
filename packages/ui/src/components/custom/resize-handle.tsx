import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps, MouseEvent as ReactMouseEvent } from 'react'
import { useState } from 'react'

let dragOverlay: HTMLDivElement | undefined

const showDragOverlay = (cursor: string) => {
  dragOverlay ??= document.createElement('div')
  dragOverlay.className = `fixed top-0 left-0 z-1000 size-full ${cursor}`

  if (!dragOverlay.parentElement) {
    document.body.append(dragOverlay)
  }
}

const sides = {
  bottom: { axis: 'y', direction: 1 },
  left: { axis: 'x', direction: -1 },
  right: { axis: 'x', direction: 1 },
  top: { axis: 'y', direction: -1 },
} as const

export const ResizeHandle = ({
  getValue,
  onResize,
  onResizingChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  side = 'right',
  className,
  children,
  onMouseDown,
  ...props
}: {
  getValue: () => number
  onResize: (value: number) => void
  onResizingChange?: (resizing: boolean) => void
  min?: number | (() => number)
  max?: number | (() => number)
  side?: keyof typeof sides
} & Omit<ComponentProps<'div'>, 'onResize'>) => {
  const [isResizing, setIsResizing] = useState(false)
  const { axis, direction } = sides[side]
  const cursor = axis === 'x' ? 'cursor-col-resize' : 'cursor-row-resize'

  const setResizing = (resizing: boolean) => {
    setIsResizing(resizing)
    onResizingChange?.(resizing)
  }

  const startResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    setResizing(true)

    const start = axis === 'x' ? event.clientX : event.clientY
    const startValue = getValue()
    const minValue = typeof min === 'function' ? min() : min
    const maxValue = typeof max === 'function' ? max() : max

    const handleMouseMove = (moveEvent: MouseEvent) => {
      showDragOverlay(cursor)
      onResize(
        Math.min(
          maxValue,
          Math.max(
            minValue,
            startValue +
              direction *
                ((axis === 'x' ? moveEvent.clientX : moveEvent.clientY) - start)
          )
        )
      )
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      setResizing(false)
      dragOverlay?.remove()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- interactive resize handle
      role="separator"
      aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
      tabIndex={0}
      data-resizing={isResizing || undefined}
      className={cn('group/resize-handle select-none', cursor, className)}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        startResize(event)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

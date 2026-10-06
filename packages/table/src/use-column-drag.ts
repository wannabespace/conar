import { useHotkey } from '@tanstack/react-hotkeys'
import type { MotionValue } from 'motion'
import { animate, clamp, motionValue, moveItem, styleEffect } from 'motion'
import type { PointerEvent, RefObject } from 'react'
import { useRef, useState } from 'react'

import type { GridColumn } from './columns'
import { columnSlots, columnVars } from './columns'

const COLUMN_TRANSITION = {
  duration: 0.22,
  ease: [0.32, 0.72, 0, 1],
} as const

interface Drag {
  column: GridColumn
  from: number
  moved: boolean
  slots: Map<string, number>
  startX: number
  to: number
}

export type ColumnDragHandle = ReturnType<typeof useColumnDrag>['handlers'] & {
  'data-grid-column': string
}

const holdsSlot = (column: GridColumn) => column.fixed || column.pinned

const targetIndex = (columns: GridColumn[], drag: Drag, offset: number) => {
  const center =
    (drag.slots.get(drag.column.id) ?? 0) + offset + drag.column.size / 2
  const crossed = columns.filter(
    (column) =>
      column.id !== drag.column.id &&
      (drag.slots.get(column.id) ?? 0) + column.size / 2 < center
  ).length
  return clamp(
    columns.findIndex((column) => !holdsSlot(column)),
    columns.findLastIndex((column) => !holdsSlot(column)),
    crossed
  )
}

export const useColumnDrag = ({
  columns,
  onReorder,
  scrollRef,
}: {
  columns: GridColumn[]
  onReorder?: (ids: string[]) => void
  scrollRef: RefObject<HTMLDivElement | null>
}) => {
  const drag = useRef<Drag | null>(null)
  const shifts = useRef(new Map<string, MotionValue<number>>())
  const [dragging, setDragging] = useState<string | null>(null)

  const shiftOf = (id: string) => {
    const existing = shifts.current.get(id)
    if (existing) {
      return existing
    }
    const shift = motionValue(0)
    if (scrollRef.current) {
      styleEffect(scrollRef.current, { [columnVars(id).shift]: shift })
    }
    shifts.current.set(id, shift)
    return shift
  }

  const settle = (commit: boolean) => {
    const { current } = drag
    drag.current = null
    if (!current?.moved) {
      return
    }

    const order = commit ? moveItem(columns, current.from, current.to) : columns
    const slots = columnSlots(order)
    for (const column of columns) {
      const shift = shiftOf(column.id)
      shift.jump(
        shift.get() +
          (current.slots.get(column.id) ?? 0) -
          (slots.get(column.id) ?? 0)
      )
      animate(shift, 0, {
        ...COLUMN_TRANSITION,
        onComplete: () =>
          column.id === current.column.id &&
          !drag.current?.moved &&
          setDragging(null),
      })
    }

    if (commit && current.to !== current.from) {
      onReorder?.(order.map((column) => column.id))
    }
  }

  useHotkey('Escape', () => settle(false), { enabled: dragging !== null })

  const handlers = {
    onLostPointerCapture: () => settle(true),
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      const from = columns.findIndex(
        (column) => column.id === event.currentTarget.dataset.gridColumn
      )
      const column = columns[from]
      const target = event.target instanceof Element ? event.target : null
      const isControl = target?.closest('button, [role="separator"]')
      // React bubbles the header's portalled menus through here; capturing their press swallows the item's click.
      const isPortalled = !event.currentTarget.contains(target)
      if (
        !column ||
        holdsSlot(column) ||
        !onReorder ||
        event.button !== 0 ||
        isControl ||
        isPortalled
      ) {
        return
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = {
        column,
        from,
        moved: false,
        slots: columnSlots(columns),
        startX: event.clientX + (scrollRef.current?.scrollLeft ?? 0),
        to: from,
      }
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const { current } = drag
      const element = scrollRef.current
      if (!current || !element) {
        return
      }
      const offset = event.clientX + element.scrollLeft - current.startX
      if (!current.moved) {
        current.moved = true
        setDragging(current.column.id)
      }
      shiftOf(current.column.id).jump(offset)

      const to = targetIndex(columns, current, offset)
      if (to === current.to) {
        return
      }
      current.to = to
      const slots = columnSlots(moveItem(columns, current.from, to))
      for (const other of columns) {
        if (other.id !== current.column.id) {
          animate(
            shiftOf(other.id),
            (slots.get(other.id) ?? 0) - (current.slots.get(other.id) ?? 0),
            COLUMN_TRANSITION
          )
        }
      }
    },
  }

  const setWidth = (id: string, width: number) =>
    scrollRef.current?.style.setProperty(columnVars(id).width, `${width}px`)

  return { dragging, handlers, setWidth }
}

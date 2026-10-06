import { useHotkey } from '@tanstack/react-hotkeys'
import type { MotionValue } from 'motion'
import { animate, motionValue } from 'motion'
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
  moved: boolean
  slots: Map<string, number>
  startX: number
  target: GridColumn[]
}

export interface ColumnDragHandle {
  'data-grid-column': string
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
}

const targetOrder = (columns: GridColumn[], drag: Drag, offset: number) => {
  const others = columns.filter((column) => column.id !== drag.column.id)
  const center =
    (drag.slots.get(drag.column.id) ?? 0) + offset + drag.column.size / 2
  const first = others.findIndex((column) => !column.fixed)
  const last = others.findLastIndex((column) => !column.fixed) + 1
  const crossed = others.filter(
    (column) => (drag.slots.get(column.id) ?? 0) + column.size / 2 < center
  ).length
  others.splice(Math.min(Math.max(crossed, first), last), 0, drag.column)
  return others
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

  // `animate(element, { '--var': … })` keeps its own value per element and ignores a hand-written property, so every shift goes through one MotionValue.
  const shiftOf = (id: string) => {
    const existing = shifts.current.get(id)
    if (existing) {
      return existing
    }
    const shift = motionValue(0)
    const { shift: name } = columnVars(id)
    shift.on('change', (x) =>
      scrollRef.current?.style.setProperty(name, `${x}px`)
    )
    shifts.current.set(id, shift)
    return shift
  }

  const settle = (commit: boolean) => {
    const { current } = drag
    drag.current = null
    if (!current?.moved) {
      return
    }

    const order = commit ? current.target : columns
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
          column.id === current.column.id && !drag.current && setDragging(null),
      })
    }

    const ids = order.map((column) => column.id)
    if (commit && ids.join('\n') !== columns.map((c) => c.id).join('\n')) {
      onReorder?.(ids)
    }
  }

  useHotkey('Escape', () => settle(false), { enabled: dragging !== null })

  const columnOf = (event: PointerEvent<HTMLElement>) =>
    columns.find(
      (column) => column.id === event.currentTarget.dataset.gridColumn
    )

  const handlers: Omit<ColumnDragHandle, 'data-grid-column'> = {
    onLostPointerCapture: () => settle(true),
    onPointerDown: (event) => {
      const column = columnOf(event)
      const isControl =
        event.target instanceof Element &&
        event.target.closest('button, [role="separator"]')
      if (
        !column ||
        column.fixed ||
        !onReorder ||
        event.button !== 0 ||
        isControl
      ) {
        return
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = {
        column,
        moved: false,
        slots: columnSlots(columns),
        startX: event.clientX + (scrollRef.current?.scrollLeft ?? 0),
        target: columns,
      }
    },
    onPointerMove: (event) => {
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

      const target = targetOrder(columns, current, offset)
      if (target.every((entry, index) => entry === current.target[index])) {
        return
      }
      current.target = target
      const slots = columnSlots(target)
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
    onPointerUp: () => settle(true),
  }

  const setWidth = (id: string, width: number) =>
    scrollRef.current?.style.setProperty(columnVars(id).width, `${width}px`)

  return { dragging, handlers, setWidth }
}

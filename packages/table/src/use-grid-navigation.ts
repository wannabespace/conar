import { useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'
import { useRef, useState } from 'react'

import type { GridColumn } from './columns'
import { glideIntoView } from './glide-into-view'
import type { ScrollToCell } from './grid'

export const HEADER_ROW = -1

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/** The caller marks the cursor's cell with `data-cursor` and passes `scrollToRef` to `Grid`: that is how a move finds the cell to scroll to, or mounts a virtualized one. */
export const useGridNavigation = ({
  columns,
  onActivateHeader,
  rowCount,
  scrollRef,
}: {
  columns: GridColumn[]
  onActivateHeader: (column: string) => void
  rowCount: number
  scrollRef: RefObject<HTMLDivElement | null>
}) => {
  const scrollToRef = useRef<ScrollToCell>(null)
  const [position, setPosition] = useState({ column: 0, row: 0 })
  const cursor = { ...position, row: Math.min(position.row, rowCount - 1) }

  const place = (row: number, column: number) => {
    const next = {
      column: clamp(column, 0, columns.length - 1),
      row: clamp(row, HEADER_ROW, rowCount - 1),
    }
    setPosition(next)
    requestAnimationFrame(() => {
      const scroller = scrollRef.current
      const cell = scroller?.querySelector('[data-cursor]')
      const id = columns[next.column]?.id
      if (scroller && cell) {
        glideIntoView(scroller, cell)
      } else if (id) {
        scrollToRef.current?.(Math.max(next.row, 0), id)
      }
    })
  }

  const activate = () => {
    const id = columns[cursor.column]?.id
    if (cursor.row === HEADER_ROW && id) {
      onActivateHeader(id)
    }
  }

  useHotkeys(
    [
      {
        callback: () => place(cursor.row - 1, cursor.column),
        hotkey: 'ArrowUp',
      },
      {
        callback: () => place(cursor.row + 1, cursor.column),
        hotkey: 'ArrowDown',
      },
      {
        callback: () => place(cursor.row, cursor.column - 1),
        hotkey: 'ArrowLeft',
      },
      {
        callback: () => place(cursor.row, cursor.column + 1),
        hotkey: 'ArrowRight',
      },
      { callback: () => place(cursor.row, 0), hotkey: 'Home' },
      { callback: () => place(cursor.row, columns.length - 1), hotkey: 'End' },
      { callback: activate, hotkey: 'Enter' },
      { callback: activate, hotkey: 'Space' },
      {
        callback: () => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
        },
        hotkey: 'Escape',
      },
    ],
    { target: scrollRef }
  )

  return { cursor, place, scrollToRef }
}

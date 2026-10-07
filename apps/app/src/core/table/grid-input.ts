import type { Hotkey } from '@tanstack/react-hotkeys'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { MouseEvent, PointerEvent, RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { openContextMenuOn } from '~/components/app-context-menu'

import type { CellPosition, GridCursor } from './cursor'
import { inRange } from './cursor'

// Hotkeys take no wildcard; these are the keys that start an edit by typing over the cell.
const TYPING_KEYS = [
  ...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].flatMap((key) => [key, `Shift+${key}`]),
  ...'0123456789-.',
] as Hotkey[]

const positionOf = (event: MouseEvent): CellPosition | null => {
  const cell =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-cell]')
      : null
  return cell?.dataset.column === undefined
    ? null
    : { column: cell.dataset.column, row: Number(cell.dataset.row) }
}

const isCheckbox = (event: MouseEvent) =>
  event.target instanceof Element &&
  !!event.target.closest('[data-slot="checkbox"]')

export const useGridHotkeys = ({
  canEdit,
  cursor,
  onExtendRows,
  scrollRef,
}: {
  canEdit: boolean
  cursor: GridCursor
  onExtendRows?: (direction: 'up' | 'down') => void
  scrollRef: RefObject<HTMLDivElement | null>
}) => {
  const hasCursor = useSubscription(cursor.store, {
    selector: (state) => state.cursor !== null,
  })
  const isEditing = useSubscription(cursor.store, {
    selector: (state) => state.edit !== null,
  })
  const [gridFocused, setGridFocused] = useState(false)
  const steering = gridFocused && !isEditing
  const navigating = steering && hasCursor

  // The bindings hear every descendant, so they stay off while a header button or row checkbox holds focus and owns its keys.
  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) {
      return
    }
    const track = () => setGridFocused(document.activeElement === scroller)
    scroller.addEventListener('focusin', track)
    scroller.addEventListener('focusout', track)
    return () => {
      scroller.removeEventListener('focusin', track)
      scroller.removeEventListener('focusout', track)
    }
  }, [scrollRef])

  useHotkeys(
    [
      ...(
        [
          ['ArrowUp', -1, 0],
          ['ArrowDown', 1, 0],
          ['ArrowLeft', 0, -1],
          ['ArrowRight', 0, 1],
        ] as const
      ).flatMap(([hotkey, down, right]) => [
        {
          callback: () => cursor.step(down, right),
          hotkey,
          options: { enabled: steering },
        },
        {
          callback: () => {
            if (hasCursor) {
              cursor.step(down, right, true)
            } else if (down !== 0) {
              onExtendRows?.(down > 0 ? 'down' : 'up')
            }
          },
          hotkey: `Shift+${hotkey}` as const,
          options: { enabled: steering },
        },
      ]),
      ...(['Enter', 'F2'] as const).map((hotkey) => ({
        callback: () => cursor.edit(),
        hotkey,
        options: { enabled: navigating },
      })),
      ...(['Backspace', 'Delete'] as const).map((hotkey) => ({
        callback: () => cursor.edit(''),
        hotkey,
        options: { enabled: navigating },
      })),
      ...TYPING_KEYS.map((hotkey) => ({
        callback: (event: KeyboardEvent) => cursor.edit(event.key),
        hotkey,
        options: { enabled: navigating },
      })),
      {
        callback: cursor.copy,
        hotkey: 'Mod+C',
        options: { enabled: navigating, ignoreInputs: true },
      },
      {
        callback: async () =>
          cursor.paste(await navigator.clipboard.readText()),
        hotkey: 'Mod+V',
        options: { enabled: navigating && canEdit, ignoreInputs: true },
      },
      {
        callback: cursor.fillDown,
        hotkey: 'Mod+D',
        options: { enabled: navigating && canEdit },
      },
      {
        callback: cursor.preview,
        hotkey: 'Space',
        options: { enabled: navigating },
      },
      {
        callback: () => {
          const cell = cursor.element()
          if (cell) {
            openContextMenuOn(cell)
          }
        },
        hotkey: 'Mod+.',
        options: { enabled: navigating },
      },
      {
        callback: cursor.dismiss,
        hotkey: 'Escape',
        options: { enabled: navigating },
      },
    ],
    { target: scrollRef }
  )
}

export const useGridPointer = (cursor: GridCursor) => {
  const dragging = useRef(false)
  return {
    // The press places the cursor, so a click only has the checkbox toggle left to do.
    onClick: (event: MouseEvent) => {
      if (positionOf(event) && isCheckbox(event)) {
        cursor.edit()
      }
    },
    onContextMenuCapture: (event: MouseEvent) => {
      const position = positionOf(event)
      if (position && !inRange(cursor.store.get(), position, cursor.indexOf)) {
        cursor.place(position)
      }
    },
    onDoubleClick: (event: MouseEvent) => {
      if (positionOf(event) && !isCheckbox(event)) {
        cursor.edit()
      }
    },
    onPointerDown: (event: PointerEvent) => {
      const position = positionOf(event)
      if (event.button !== 0 || !position) {
        return
      }
      dragging.current = true
      cursor.place(position, event.shiftKey)
    },
    onPointerOver: (event: PointerEvent) => {
      if (event.buttons !== 1) {
        dragging.current = false
        return
      }
      const position = positionOf(event)
      if (dragging.current && position) {
        cursor.place(position, true)
      }
    },
  }
}

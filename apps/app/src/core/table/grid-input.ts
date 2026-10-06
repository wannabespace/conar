import type { Hotkey } from '@tanstack/react-hotkeys'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { MouseEvent, PointerEvent, RefObject } from 'react'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'

import type { CellPosition, CursorStore } from './cell/cursor'
import { inRange } from './cell/cursor'
import type { GridCursor } from './grid-cursor'

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

export const useGridHotkeys = ({
  canEdit,
  cursor,
  scrollRef,
  store,
}: {
  canEdit: boolean
  cursor: GridCursor
  scrollRef: RefObject<HTMLDivElement | null>
  store: CursorStore
}) => {
  const hasCursor = useSubscription(store, {
    selector: (state) => state.cursor !== null,
  })
  const isEditing = useSubscription(store, {
    selector: (state) => state.edit !== null,
  })
  const navigating = hasCursor && !isEditing

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
          options: { enabled: !isEditing },
        },
        {
          callback: () => cursor.step(down, right, true),
          hotkey: `Shift+${hotkey}` as const,
          options: { enabled: navigating },
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
        callback: () =>
          store.get().anchor
            ? store.set((state) => ({ ...state, anchor: null }))
            : cursor.clear(),
        hotkey: 'Escape',
        options: { enabled: navigating },
      },
    ],
    { target: scrollRef }
  )
}

export const useGridPointer = ({
  cursor,
  indexOf,
  store,
}: {
  cursor: GridCursor
  indexOf: (column: string) => number
  store: CursorStore
}) => {
  const dragging = useRef(false)
  return {
    // The press places the cursor, so a click only has the checkbox toggle left to do.
    onClick: (event: MouseEvent) => {
      if (
        positionOf(event) &&
        event.target instanceof Element &&
        event.target.closest('[data-slot="checkbox"]')
      ) {
        cursor.edit()
      }
    },
    onContextMenuCapture: (event: MouseEvent) => {
      const position = positionOf(event)
      if (position && !inRange(store.get(), position, indexOf)) {
        cursor.place(position)
      }
    },
    onDoubleClick: (event: MouseEvent) => {
      if (positionOf(event)) {
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

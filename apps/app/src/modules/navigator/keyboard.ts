import { useHotkey, useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { navigatorOpenValue } from './stores'

let mountedSearch: HTMLInputElement | null = null

const focusNavigator = () => {
  flushSync(() => navigatorOpenValue.set(true))
  mountedSearch?.focus()
}

// Must stay on window: base-ui popups and scoped hotkeys stop a consumed Escape at the document, so only an unconsumed one arrives here.
export const useEscapeToNavigator = () =>
  useHotkey(
    'Escape',
    (event) => {
      if (!event.defaultPrevented) {
        focusNavigator()
      }
    },
    { preventDefault: false, target: window }
  )

export const useNavigatorSearch = ({
  activeId,
  ids,
  listRef,
  search,
  onClear,
  onOpen,
  onReveal,
}: {
  activeId?: string
  ids: string[]
  listRef: RefObject<HTMLElement | null>
  search: string
  onClear: () => void
  onOpen: (id: string) => void
  onReveal?: (id: string) => void
}) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [moved, setMoved] = useState<{ id: string; search: string } | null>(
    null
  )
  const fallback =
    !search && activeId && ids.includes(activeId) ? activeId : ids[0]
  const highlighted =
    moved?.search === search && ids.includes(moved.id) ? moved.id : fallback

  const move = (delta: number) => {
    const index = highlighted ? ids.indexOf(highlighted) : -1
    const next = ids[Math.min(ids.length - 1, Math.max(0, index + delta))]
    if (next) {
      setMoved({ id: next, search })
      onReveal?.(next)
    }
  }

  useHotkeys(
    [
      { callback: () => move(1), hotkey: 'ArrowDown' },
      { callback: () => move(-1), hotkey: 'ArrowUp' },
      {
        callback: () => highlighted && onOpen(highlighted),
        hotkey: 'Enter',
      },
      {
        callback: () =>
          listRef.current
            ?.querySelector<HTMLElement>(
              '[data-highlighted] [aria-haspopup=menu]'
            )
            ?.click(),
        hotkey: 'Mod+.',
      },
      { callback: onClear, hotkey: 'Escape', options: { enabled: !!search } },
    ],
    { target: searchRef }
  )

  return {
    highlightedId: focused ? highlighted : undefined,
    searchProps: {
      onBlur: () => setFocused(false),
      onFocus: () => {
        setFocused(true)
        setMoved(null)
      },
      ref: (input: HTMLInputElement) => {
        searchRef.current = input
        mountedSearch = input
        return () => {
          if (mountedSearch === input) {
            mountedSearch = null
          }
        }
      },
    },
  }
}

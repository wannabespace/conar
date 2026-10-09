import { useHotkey, useHotkeys } from '@tanstack/react-hotkeys'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { openContextMenuOn } from '~/components/app-context-menu'

import { navigatorOpenValue } from './stores'

let mountedSearch: HTMLInputElement | null = null

export const focusNavigator = () => {
  flushSync(() => navigatorOpenValue.set(true))
  mountedSearch?.focus()
}

// Must stay on window: base-ui popups and scoped hotkeys stop a consumed Escape at the document, so only an unconsumed one arrives here.
export const useEscapeToNavigator = (enabled: boolean) =>
  useHotkey(
    'Escape',
    (event) => {
      if (!event.defaultPrevented) {
        focusNavigator()
      }
    },
    { enabled, preventDefault: false, target: window }
  )

const claimsCaretEdge = (event: KeyboardEvent, edge: 'start' | 'end') => {
  const input = event.target
  const atEdge =
    input instanceof HTMLInputElement &&
    input.selectionStart === input.selectionEnd &&
    input.selectionStart === (edge === 'start' ? 0 : input.value.length)
  if (atEdge) {
    event.preventDefault()
  }
  return atEdge
}

export const useNavigatorSearch = ({
  activeId,
  nodes,
  search,
  onBack,
  onClear,
}: {
  activeId?: string
  nodes: { id: string; open?: boolean; parent?: string }[]
  search: string
  onBack?: () => void
  onClear: () => void
}) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [moved, setMoved] = useState<{ id: string; search: string } | null>(
    null
  )
  const ids = nodes.map(({ id }) => id)
  const fallback =
    !search && activeId && ids.includes(activeId) ? activeId : ids[0]
  const highlighted =
    moved?.search === search && ids.includes(moved.id) ? moved.id : fallback
  const index = nodes.findIndex((candidate) => candidate.id === highlighted)
  const node = nodes[index]
  const highlightedId = focused ? highlighted : undefined

  // A virtualized list must keep the highlighted row rendered (TablesTree scrolls it into view), or Enter and ⌘. find nothing.
  const highlightedControl = () =>
    listRef.current?.querySelector<HTMLElement>(
      '[data-highlighted] :is(a, button)'
    )

  const move = (delta: number) => {
    const next = ids[Math.min(ids.length - 1, Math.max(0, index + delta))]
    if (next) {
      setMoved({ id: next, search })
    }
  }

  useHotkeys(
    [
      { callback: () => move(1), hotkey: 'ArrowDown' },
      { callback: () => move(-1), hotkey: 'ArrowUp' },
      {
        callback: (event) => {
          if (!claimsCaretEdge(event, 'end')) {
            return
          }
          if (node?.open) {
            move(1)
          } else {
            highlightedControl()?.click()
          }
        },
        hotkey: 'ArrowRight',
        options: { preventDefault: false },
      },
      {
        callback: (event) => {
          if (!claimsCaretEdge(event, 'start')) {
            return
          }
          if (node?.open) {
            highlightedControl()?.click()
          } else if (node?.parent) {
            setMoved({ id: node.parent, search })
          } else if (onBack) {
            // The exiting panel's search keeps focus through its exit animation, so the incoming search's idle-focus in `ref` skips it.
            flushSync(onBack)
            mountedSearch?.focus()
          }
        },
        hotkey: 'ArrowLeft',
        options: { preventDefault: false },
      },
      {
        callback: (event) => {
          if (!event.isComposing) {
            highlightedControl()?.click()
          }
        },
        hotkey: 'Enter',
      },
      {
        callback: () => {
          const control = highlightedControl()
          if (control) {
            openContextMenuOn(control)
          }
        },
        hotkey: 'Mod+.',
      },
      { callback: onClear, hotkey: 'Escape', options: { enabled: !!search } },
    ],
    { target: searchRef }
  )

  return {
    highlightedId,
    listRef,
    searchProps: {
      onBlur: () => setFocused(false),
      onFocus: () => {
        setFocused(true)
        setMoved(null)
      },
      ref: (input: HTMLInputElement) => {
        searchRef.current = input
        mountedSearch = input
        // Only idle focus: a Schema page's autoFocus search mounting in the same commit must keep it.
        if (document.activeElement === document.body) {
          input.focus({ preventScroll: true })
        }
        return () => {
          if (mountedSearch === input) {
            mountedSearch = null
          }
        }
      },
    },
  }
}

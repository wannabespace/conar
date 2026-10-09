import { useHotkey, useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'
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

interface TreeNode {
  open?: boolean
  parent?: string
}

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
  ids,
  listRef,
  nodeOf,
  search,
  onBack,
  onClear,
}: {
  activeId?: string
  ids: string[]
  listRef: RefObject<HTMLElement | null>
  nodeOf?: (id: string) => TreeNode | undefined
  search: string
  onBack?: () => void
  onClear: () => void
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
  const highlightedId = focused ? highlighted : undefined

  // A virtualized list must keep the highlighted row rendered (TablesTree scrolls it into view), or Enter and ⌘. find nothing.
  const highlightedControl = () =>
    listRef.current?.querySelector<HTMLElement>(
      '[data-highlighted] :is(a, button)'
    )

  const move = (delta: number) => {
    const index = highlighted ? ids.indexOf(highlighted) : -1
    const next = ids[Math.min(ids.length - 1, Math.max(0, index + delta))]
    if (next) {
      setMoved({ id: next, search })
    }
  }

  const stepIn = () => {
    if (highlighted && nodeOf?.(highlighted)?.open) {
      move(1)
    } else {
      highlightedControl()?.click()
    }
  }

  const stepOut = () => {
    const node = highlighted ? nodeOf?.(highlighted) : undefined
    if (node?.open) {
      highlightedControl()?.click()
    } else if (node?.parent) {
      setMoved({ id: node.parent, search })
    } else if (onBack) {
      // The exiting panel's search keeps focus through its exit animation, so the incoming search's idle-focus in `ref` skips it.
      flushSync(onBack)
      mountedSearch?.focus()
    }
  }

  useHotkeys(
    [
      { callback: () => move(1), hotkey: 'ArrowDown' },
      { callback: () => move(-1), hotkey: 'ArrowUp' },
      {
        callback: (event) => {
          if (claimsCaretEdge(event, 'end')) {
            stepIn()
          }
        },
        hotkey: 'ArrowRight',
        options: { preventDefault: false },
      },
      {
        callback: (event) => {
          if (claimsCaretEdge(event, 'start')) {
            stepOut()
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

import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { toggleChat, toggleResults, toggleSidebar } from '~/lib/layout-store'

function isCtrlAndKey(event: KeyboardEvent, key: string, shift = false) {
  const modifierMatch = event.metaKey || event.ctrlKey
  const shiftMatch = shift ? event.shiftKey : !event.shiftKey
  return event.key.toLowerCase() === key.toLowerCase() && modifierMatch && shiftMatch
}

export function useLayoutShortcuts(options?: {
  onNewChat?: () => void
  onOpenLayoutPopover?: () => void
}) {
  useKeyboardEvent(
    e => isCtrlAndKey(e, 'b'),
    (e) => {
      e.preventDefault()
      toggleSidebar()
    },
  )

  useKeyboardEvent(
    e => isCtrlAndKey(e, 'c', true),
    (e) => {
      e.preventDefault()
      toggleChat()
    },
  )

  useKeyboardEvent(
    e => isCtrlAndKey(e, 'r', true),
    (e) => {
      e.preventDefault()
      toggleResults()
    },
  )

  useKeyboardEvent(
    e => isCtrlAndKey(e, 'n'),
    (e) => {
      e.preventDefault()
      options?.onNewChat?.()
    },
  )

  useKeyboardEvent(
    e => isCtrlAndKey(e, ','),
    (e) => {
      e.preventDefault()
      options?.onOpenLayoutPopover?.()
    },
  )
}

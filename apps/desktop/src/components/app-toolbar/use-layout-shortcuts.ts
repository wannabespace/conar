import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { toggleChat, toggleResults, toggleSidebar } from '~/entities/database'

function isCtrlAndKey(event: KeyboardEvent, key: string, shift = false) {
  const modifierMatch = event.metaKey || event.ctrlKey
  const shiftMatch = shift ? event.shiftKey : !event.shiftKey
  return event.key.toLowerCase() === key.toLowerCase() && modifierMatch && shiftMatch
}

export function useLayoutShortcuts(options: {
  databaseId: string
  onNewChat?: () => void
  onOpenLayoutPopover?: () => void
}) {
  useKeyboardEvent(
    e => isCtrlAndKey(e, 'b'),
    (e) => {
      e.preventDefault()
      toggleSidebar(options.databaseId)
    },
  )

  useKeyboardEvent(
    e => isCtrlAndKey(e, 'j'),
    (e) => {
      e.preventDefault()
      toggleChat(options.databaseId)
    },
  )

  useKeyboardEvent(
    e => isCtrlAndKey(e, 'r', true),
    (e) => {
      e.preventDefault()
      toggleResults(options.databaseId)
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

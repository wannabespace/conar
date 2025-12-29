import { isCtrlAndKey } from '@conar/shared/utils/os'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { toggleChat, toggleResults, toggleSidebar } from '~/entities/database'

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
    e => isCtrlAndKey(e, 'r'),
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

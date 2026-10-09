import { HistoryIcon } from '@hugeicons/core-free-icons'

import type {
  CommandContext,
  CommandEntry,
} from '~/modules/actions-center/types'

import { toggleLogger } from './logger-open'

export const queryLoggerCommands = ({
  current,
}: CommandContext): CommandEntry[] =>
  current
    ? [
        {
          action: () => toggleLogger(current.connectionResource.id),
          group: 'View',
          icon: HistoryIcon,
          keywords: ['logs', 'queries', 'history'],
          order: 30,
          shortcut: 'J',
          value: 'Toggle query logger',
        },
      ]
    : []

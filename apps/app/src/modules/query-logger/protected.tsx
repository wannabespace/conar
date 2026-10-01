import { HistoryIcon } from '@hugeicons/core-free-icons'

import type { ProtectedModule } from '~/lib/module'

import { loggerOpen } from './logger-open'
import { QueryLoggerToggle } from './query-logger-toggle'

export default {
  commands: ({ current }) =>
    current
      ? [
          {
            action: () =>
              loggerOpen(current.connectionResource.id).set(
                (opened) => !opened
              ),
            group: 'View',
            icon: HistoryIcon,
            keywords: ['logs', 'queries', 'history'],
            shortcut: 'J',
            value: 'Toggle query logger',
          },
        ]
      : [],
  titlebar: [{ Component: QueryLoggerToggle, order: 50 }],
} satisfies ProtectedModule

import { HistoryIcon } from '@hugeicons/core-free-icons'

import type { ProtectedModule } from '~/lib/module'
import { posthog } from '~/lib/posthog'

import { loggerOpen } from './logger-open'
import { QueryLoggerToggle } from './query-logger-toggle'

export default {
  commands: ({ current }) =>
    current
      ? [
          {
            action: () => {
              loggerOpen(current.connectionResource.id).set((opened) => !opened)
              posthog.capture('query_logger_toggled')
            },
            group: 'View',
            icon: HistoryIcon,
            keywords: ['logs', 'queries', 'history'],
            order: 30,
            shortcut: 'J',
            value: 'Toggle query logger',
          },
        ]
      : [],
  titlebar: [{ Component: QueryLoggerToggle, order: 50 }],
} satisfies ProtectedModule

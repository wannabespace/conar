import { HistoryIcon } from '@hugeicons/core-free-icons'

import type { ProtectedModule } from '~/lib/module'

import { toggleLogger } from './logger-open'

export default {
  commands: ({ current }) =>
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
      : [],
} satisfies ProtectedModule

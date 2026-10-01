import { Download01Icon } from '@hugeicons/core-free-icons'

import type { ProtectedModule } from '~/lib/module'

import { UpdateButton, VersionButton } from './update-button'
import { checkForUpdates } from './updates-observer'

export default {
  commands: () =>
    window.electron
      ? [
          {
            action: checkForUpdates,
            group: 'Application',
            icon: Download01Icon,
            keywords: ['update', 'version'],
            value: 'Check for updates…',
          },
        ]
      : [],
  titlebar: [
    { Component: VersionButton, order: 10 },
    { Component: UpdateButton, order: 11 },
  ],
} satisfies ProtectedModule

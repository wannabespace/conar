import { Download01Icon } from '@hugeicons/core-free-icons'

import type { CommandEntry } from '~/modules/actions-center/types'

import { checkForUpdates } from './updates-observer'

export const updatesCommands = (): CommandEntry[] =>
  window.electron
    ? [
        {
          action: checkForUpdates,
          group: 'Application',
          icon: Download01Icon,
          keywords: ['update', 'version'],
          order: 10,
          value: 'Check for updates…',
        },
      ]
    : []

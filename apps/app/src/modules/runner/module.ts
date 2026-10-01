import { ComputerTerminal01Icon } from '@hugeicons/core-free-icons'

import type { AppModule } from '~/lib/module'

import { openRunnerTab, runnerTab } from './lib/tab'

export default {
  newTabActions: [
    {
      icon: ComputerTerminal01Icon,
      keywords: ['sql', 'runner'],
      label: 'New query',
      open: openRunnerTab,
    },
  ],
  tabs: [runnerTab],
} satisfies AppModule

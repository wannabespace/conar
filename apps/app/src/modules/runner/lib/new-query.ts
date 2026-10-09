import { ComputerTerminal01Icon } from '@hugeicons/core-free-icons'
import { nanoid } from 'nanoid'

import { openTab } from '~/core/tabs/actions'

export const openRunnerTab = (resourceId: string) =>
  openTab(resourceId, `runner:${nanoid(10)}`)

export const newQueryAction = {
  icon: ComputerTerminal01Icon,
  keywords: ['sql', 'runner'],
  label: 'New query',
  open: openRunnerTab,
}

import { PlayIcon } from '@hugeicons/core-free-icons'
import { nanoid } from 'nanoid'

import { openTab } from '~/core/tabs/actions'
import type { TabKind } from '~/lib/module'

export const runnerStoreKey = (resourceId: string, tabId: string) =>
  `${resourceId}.${tabId}.store`

export const openRunnerTab = (resourceId: string) =>
  openTab(resourceId, `runner:${nanoid(10)}`)

export interface RunnerParams {
  id: string
}

export const runnerTab: TabKind<RunnerParams> = {
  icon: PlayIcon,
  label: (params, siblings) =>
    siblings.length > 1
      ? `Query ${siblings.findIndex((sibling) => sibling.id === params.id) + 1}`
      : 'Query',
  match: (id) => (/^runner:[^:]+$/u.test(id) ? { id } : null),
  // Runner ids are throwaway, so their storage is orphaned on close.
  onClose: (resourceId, id) =>
    localStorage.removeItem(runnerStoreKey(resourceId, id)),
  title: () => 'Query',
  type: 'runner',
}

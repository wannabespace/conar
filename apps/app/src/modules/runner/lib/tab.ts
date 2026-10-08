import { PlayIcon } from '@hugeicons/core-free-icons'

import type { TabKind } from '~/core/tabs/types'

export const runnerStoreKey = (resourceId: string, tabId: string) =>
  `${resourceId}.${tabId}.store`

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

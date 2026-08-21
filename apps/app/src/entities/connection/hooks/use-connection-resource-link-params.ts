import type { LinkProps } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { getConnectionResourceStore } from '~/entities/connection/store'

export const useConnectionResourceLinkParams = (
  resourceId: string
): LinkProps => {
  const store = getConnectionResourceStore(resourceId)
  const [activeTabId, tabs] = useSubscription(store, {
    selector: (state) => [state.activeTabId, state.tabs] as const,
  })

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  return activeTab
    ? {
        params: { resourceId, tabId: activeTab.id },
        to: '/connection/$resourceId/$tabId',
      }
    : { params: { resourceId }, to: '/connection/$resourceId' }
}

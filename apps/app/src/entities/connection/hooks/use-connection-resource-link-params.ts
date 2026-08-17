import type { LinkProps } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useSubscription } from 'seitu/react'

import { getConnectionResourceStore } from '~/entities/connection/store'

export const useConnectionResourceLinkParams = (resourceId: string) => {
  const store = getConnectionResourceStore(resourceId)
  const [activeTabId, tabs] = useSubscription(store, {
    selector: (state) => [state.activeTabId, state.tabs] as const,
  })

  return useMemo((): LinkProps => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId)

    return activeTab
      ? {
          params: { resourceId, tabId: activeTab.id },
          to: '/connection/$resourceId/$tabId',
        }
      : { params: { resourceId }, to: '/connection/$resourceId' }
  }, [resourceId, activeTabId, tabs])
}

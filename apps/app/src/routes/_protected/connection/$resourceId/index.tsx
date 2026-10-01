import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PaneEmpty } from '~/components/pane-empty'
import { getConnectionResourceStore } from '~/core/connection/stores'
import { resolveTab } from '~/core/tabs/kinds'
import { workspaceModules } from '~/lib/workspace-modules'

const EmptyPane = () => {
  const router = useRouter()

  // The tab route is code-split and ships no pending UI: without this the first
  // click from an empty pane waits on the chunk with nothing on screen.
  useEffect(() => {
    void router.loadRouteChunk(
      router.routesById['/_protected/connection/$resourceId/$tabId']
    )
  }, [router])

  return (
    <PaneEmpty
      icon={LayoutTable02Icon}
      title="Nothing Open"
      description="Choose a table from the sidebar, or open a new query to get started."
    >
      {workspaceModules.emptyPane.map(({ Component }, index) => (
        <Component key={index} />
      ))}
    </PaneEmpty>
  )
}

export const Route = createFileRoute('/_protected/connection/$resourceId/')({
  component: EmptyPane,
  beforeLoad: ({ params }) => {
    const { activeTabId, tabs } = getConnectionResourceStore(
      params.resourceId
    ).get()

    const isOpenable =
      !!activeTabId &&
      !!resolveTab(activeTabId) &&
      tabs.some((tab) => tab.id === activeTabId)

    if (isOpenable) {
      throw redirect({
        params: { resourceId: params.resourceId, tabId: activeTabId },
        to: '/connection/$resourceId/$tabId',
      })
    }
  },
})

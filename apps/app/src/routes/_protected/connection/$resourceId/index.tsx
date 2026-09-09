import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { PaneEmpty } from '~/components/pane-empty'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'
import { parseTabId } from '~/entities/connection/store/tabs/ids'

const EmptyPane = () => (
  <PaneEmpty
    icon={LayoutTable02Icon}
    title="Nothing Open"
    description="Choose a table from the sidebar, or open a new query to get started."
  />
)

export const Route = createFileRoute('/_protected/connection/$resourceId/')({
  component: EmptyPane,
  beforeLoad: ({ params }) => {
    const { activeTabId, tabs } = getConnectionResourceStore(
      params.resourceId
    ).get()

    const isOpenable =
      !!activeTabId &&
      !!parseTabId(activeTabId) &&
      tabs.some((tab) => tab.id === activeTabId)

    if (isOpenable) {
      throw redirect({
        params: { resourceId: params.resourceId, tabId: activeTabId },
        to: '/connection/$resourceId/$tabId',
      })
    }
  },
})

import { RiTable2 } from '@remixicon/react'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { PaneEmpty } from '~/components/pane-empty'
import {
  getConnectionResourceStore,
  parseTabId,
} from '~/entities/connection/store'

const EmptyPane = () => (
  <PaneEmpty
    icon={RiTable2}
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

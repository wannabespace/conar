import { RiTable2 } from '@remixicon/react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { createFileRoute, redirect } from '@tanstack/react-router'

import {
  getConnectionResourceStore,
  parseTabId,
} from '~/entities/connection/store'

const EmptyPane = () => (
  <Empty className="min-h-0 flex-1 p-4 md:p-4">
    <div className="dither-in">
      <EmptyHeader className="gap-1">
        <EmptyMedia
          variant="icon"
          className="bg-muted/60 text-muted-foreground/70 mb-3 size-14 rounded-2xl [&_svg]:size-7"
        >
          <RiTable2 />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-medium tracking-normal">
          Nothing Open
        </EmptyTitle>
        <EmptyDescription className="max-w-64 text-xs">
          Choose a table from the sidebar, or open a new query to get started.
        </EmptyDescription>
      </EmptyHeader>
    </div>
  </Empty>
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

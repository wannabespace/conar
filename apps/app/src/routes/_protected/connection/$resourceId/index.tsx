import { RiTable2 } from '@remixicon/react'
import { DitherBackground } from '@tamery/ui/components/custom/dither-background'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'motion/react'

import {
  getConnectionResourceStore,
  parseTabId,
} from '~/entities/connection/store'

const EmptyPane = () => (
  <Empty className="relative isolate min-h-0 flex-1 overflow-hidden p-4 md:p-4">
    <DitherBackground className="-z-10 opacity-20" mask="radial" speed={0} />
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
    >
      <EmptyHeader className="gap-1">
        <EmptyMedia
          variant="icon"
          className="bg-muted/60 text-muted-foreground/70 texture-dither mb-3 size-14 rounded-2xl [&_svg]:size-7"
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
    </motion.div>
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

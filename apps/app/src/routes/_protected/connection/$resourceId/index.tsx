import { RiTable2 } from '@remixicon/react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'motion/react'

import {
  getConnectionResourceStore,
  parseTabId,
} from '~/entities/connection/store'

const EmptyPane = () => (
  <div className="flex min-h-0 flex-1 items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center text-center"
    >
      <div className="bg-muted/60 mb-4 flex size-14 items-center justify-center rounded-2xl">
        <RiTable2 className="text-muted-foreground/70 size-7" />
      </div>
      <div className="text-sm font-medium">Nothing Open</div>
      <p className="text-muted-foreground mt-1 max-w-64 text-xs">
        Choose a table from the sidebar, or open a SQL runner to get started.
      </p>
    </motion.div>
  </div>
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

import { getRouteApi } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import type { WorkspaceModule } from '~/lib/module'
import { resourcePanelClassName } from '~/shell'

import { loggerOpen } from './logger-open'
import { QueryLoggerSkeleton } from './query-logger-skeleton'
import { QueryLoggerHotkey, QueryLoggerToggle } from './query-logger-toggle'

const QueryLogger = lazy(async () => {
  const { QueryLogger: component } = await import('./query-logger')

  return { default: component }
})

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const QueryLoggerPanel = () => {
  const { connectionResource } = useRouteContext()

  return (
    <div className="flex h-full flex-col pt-1.5">
      <div className={resourcePanelClassName}>
        <Suspense fallback={<QueryLoggerSkeleton />}>
          <QueryLogger connectionResource={connectionResource} />
        </Suspense>
      </div>
    </div>
  )
}

export default {
  mounts: [QueryLoggerHotkey],
  navigatorFooter: [{ Component: QueryLoggerToggle, order: 0 }],
  panels: [
    {
      Component: QueryLoggerPanel,
      defaultSize: 240,
      id: 'query-logger',
      label: 'query logger',
      maxSize: '60%',
      minSize: 120,
      open: loggerOpen,
      region: 'bottom',
    },
  ],
} satisfies WorkspaceModule

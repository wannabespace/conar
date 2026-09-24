import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { useQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  getRouteApi,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'

import { Link } from '~/components/link'
import { PaneEmpty } from '~/components/pane-empty'
import { capabilitiesOf } from '~/entities/connection/capabilities'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'
import { parseTabId, tableTabId } from '~/entities/connection/store/tabs/ids'

import { tableTypeIcon } from './-components/navigator/tables-list'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const RecentTables = () => {
  const { connection, connectionResource } = useRouteContext()
  const recentTables = useSubscription(
    getConnectionResourceStore(connectionResource.id),
    { selector: (state) => state.recentTables }
  )
  const { data } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )

  const tables = recentTables.flatMap((recent) => {
    const table = data?.schemas
      .find((schema) => schema.name === recent.schema)
      ?.tables.find((item) => item.name === recent.table)

    return table ? [{ ...recent, type: table.type }] : []
  })

  if (tables.length === 0) {
    return null
  }

  return (
    <div className="mt-4 flex w-72 flex-col gap-0.5">
      <span className="text-muted-foreground px-3 pb-1 text-left text-xs font-medium">
        Recent
      </span>
      {tables.map((table) => (
        <Button
          key={`${table.schema}:${table.table}`}
          variant="ghost"
          size="sm"
          className="text-foreground justify-start"
          render={
            <Link
              to="/connection/$resourceId/$tabId"
              params={{
                resourceId: connectionResource.id,
                tabId: tableTabId(table.schema, table.table),
              }}
              preload="intent"
              preloadDelay={200}
            />
          }
        >
          <HugeiconsIcon
            icon={tableTypeIcon[table.type]}
            strokeWidth={2}
            className="text-muted-foreground"
          />
          <span data-mask className="truncate">
            {table.table}
          </span>
          {capabilitiesOf(connection.type).schemas && (
            <span
              data-mask
              className="text-muted-foreground ml-auto pl-4 text-xs"
            >
              {table.schema}
            </span>
          )}
        </Button>
      ))}
    </div>
  )
}

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
      <RecentTables />
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

import type { ActiveFilter } from '@tamery/shared/filters'
import { enabledFilters } from '@tamery/shared/filters'
import { title } from '@tamery/shared/title'
import { createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { AnimateView } from 'motion/react-animate-view'
import { useDeferredValue, useEffect } from 'react'

import { sectionAvailable } from '~/entities/connection/capabilities'
import {
  prefetchConnectionResourceCore,
  prefetchConnectionResourceTableCore,
} from '~/entities/connection/fetching'
import {
  ensureTab,
  setActiveTab,
} from '~/entities/connection/store/helpers/tabs'
import { getNavigatorStore } from '~/entities/connection/store/stores'
import { parseTabId } from '~/entities/connection/store/tabs/ids'
import { tabFullTitle } from '~/entities/connection/store/tabs/title'
import type { ConnectionTab } from '~/entities/connection/store/tabs/types'

import { DefinitionsTab } from './-tabs/definitions/definitions-tab'
import { RunnerTab } from './-tabs/runner/runner-tab'
import { tablePageStore } from './-tabs/table/-lib/store'
import { TableTab } from './-tabs/table/table-tab'
import { VisualizerTab } from './-tabs/visualizer/visualizer-tab'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const TabContent = ({ tab }: { tab: ConnectionTab }) => {
  if (tab.type === 'table') {
    return <TableTab schema={tab.schema} table={tab.table} />
  }

  if (tab.type === 'runner') {
    return <RunnerTab tabId={tab.id} />
  }

  if (tab.type === 'definitions') {
    return <DefinitionsTab section={tab.section} />
  }

  return <VisualizerTab />
}

const TabPage = () => {
  const { connectionResource, tab } = useRouteContext()

  useEffect(() => {
    ensureTab(connectionResource.id, tab)
    setActiveTab(connectionResource.id, tab.id)
  }, [connectionResource.id, tab])

  // Router state commits through useSyncExternalStore, which never starts a view transition; the deferred re-render does.
  const shownResourceId = useDeferredValue(connectionResource.id)
  const shownTab = useDeferredValue(tab)

  return (
    <AnimateView
      key={`${shownResourceId}:${shownTab.id}`}
      transition={{ duration: 0.04 }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <TabContent tab={shownTab} />
      </div>
    </AnimateView>
  )
}

export const Route = createFileRoute(
  '/_protected/connection/$resourceId/$tabId'
)({
  component: TabPage,
  validateSearch: type({
    'create?': 'string',
    'filters?': 'object[]' as type.cast<ActiveFilter[]>,
    'open?': 'string',
    'orderBy?': 'object' as type.cast<Record<string, 'ASC' | 'DESC'>>,
    'schema?': 'string',
  }),
  beforeLoad: ({ context, params }) => {
    const tab = parseTabId(params.tabId)

    if (
      !tab ||
      (tab.type === 'definitions' &&
        !sectionAvailable(tab.section, context.connection.type))
    ) {
      throw redirect({
        params: { resourceId: params.resourceId },
        to: '/connection/$resourceId',
      })
    }

    getNavigatorStore(
      params.resourceId,
      tab.type === 'runner' || tab.type === 'table' ? 'tables' : 'definitions'
    )

    return { tab }
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const { connection, connectionResource, tab } = context

    prefetchConnectionResourceCore(connectionResource)

    const base = {
      connection,
      connectionResource,
      tab,
    }

    if (tab.type === 'table') {
      const store = tablePageStore({
        id: connectionResource.id,
        schema: tab.schema,
        table: tab.table,
      })
      const { filters: searchFilters, orderBy: searchOrderBy } = deps

      if (searchFilters) {
        store.set(
          (current) =>
            ({ ...current, filters: searchFilters }) satisfies typeof current
        )
      }
      if (searchOrderBy) {
        store.set(
          (current) =>
            ({ ...current, orderBy: searchOrderBy }) satisfies typeof current
        )
      }

      const pageState = store.get()

      prefetchConnectionResourceTableCore({
        connectionResource,
        query: {
          exact: false,
          filters: enabledFilters(pageState.filters),
          orderBy: pageState.orderBy,
        },
        schema: tab.schema,
        table: tab.table,
      })

      return base
    }

    return base
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title(
              tabFullTitle(loaderData.tab),
              loaderData.connection.name,
              loaderData.connectionResource.name
            ),
          },
        ]
      : [],
  }),
})

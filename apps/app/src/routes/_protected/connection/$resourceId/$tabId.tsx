import type { ActiveFilter } from '@tamery/shared/filters'
import { enabledFilters } from '@tamery/shared/filters'
import { title } from '@tamery/shared/utils/title'
import { createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect } from 'react'
import { v7 } from 'uuid'

import {
  DEFINITIONS_TITLES,
  ensureTab,
  parseTabId,
  setActiveTab,
} from '~/entities/connection/store'
import {
  prefetchConnectionResourceCore,
  prefetchConnectionResourceTableCore,
} from '~/entities/connection/utils'

import { DefinitionsTab } from './-tabs/definitions/definitions-tab'
import { createChat } from './-tabs/runner/-components/chat'
import { RunnerTab } from './-tabs/runner/runner-tab'
import { tablePageStore } from './-tabs/table/-lib/store'
import { TableTab } from './-tabs/table/table-tab'
import { VisualizerTab } from './-tabs/visualizer/visualizer-tab'

const routeApi = getRouteApi('/_protected/connection/$resourceId/$tabId')

const TabPage = () => {
  const { connectionResource, tab } = routeApi.useRouteContext()

  useEffect(() => {
    ensureTab(connectionResource.id, tab)
    setActiveTab(connectionResource.id, tab.id)
  }, [connectionResource.id, tab])

  if (tab.type === 'table') {
    return <TableTab schema={tab.schema} table={tab.table} />
  }

  if (tab.type === 'runner') {
    return <RunnerTab tabId={tab.id} />
  }

  if (tab.type === 'definitions') {
    return <DefinitionsTab section={tab.section} />
  }

  return (
    <div className="min-h-0 flex-1">
      <VisualizerTab />
    </div>
  )
}

const tabTitle = (
  tab: NonNullable<ReturnType<typeof parseTabId>>,
  section: string | null
) => {
  if (tab.type === 'table') {
    return `${tab.schema}.${tab.table}`
  }
  if (tab.type === 'definitions') {
    return section ?? 'Definitions'
  }
  return tab.type === 'runner' ? 'SQL Runner' : 'Visualizer'
}

export const Route = createFileRoute(
  '/_protected/connection/$resourceId/$tabId'
)({
  component: TabPage,
  validateSearch: type({
    'chatId?': 'string.uuid.v7 | undefined',
    'error?': 'string | undefined',
    'filters?': 'object[]' as type.cast<ActiveFilter[]>,
    'orderBy?': 'object' as type.cast<Record<string, 'ASC' | 'DESC'>>,
  }),
  beforeLoad: ({ params }) => {
    const tab = parseTabId(params.tabId)

    if (!tab) {
      throw redirect({
        params: { resourceId: params.resourceId },
        to: '/connection/$resourceId',
      })
    }

    return { tab }
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { connection, connectionResource, tab } = context

    prefetchConnectionResourceCore(connectionResource)

    const base = {
      chat: null as Awaited<ReturnType<typeof createChat>> | null,
      connection,
      connectionResource,
      section:
        tab.type === 'definitions' ? DEFINITIONS_TITLES[tab.section] : null,
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
          exact: pageState.exact,
          filters: enabledFilters(pageState.filters),
          orderBy: pageState.orderBy,
        },
        schema: tab.schema,
        table: tab.table,
      })

      return base
    }

    if (tab.type === 'runner') {
      const { chatsCollection, chatsMessagesCollection } = context.collections

      await Promise.all([
        chatsCollection.stateWhenReady(),
        chatsMessagesCollection.stateWhenReady(),
      ])

      return {
        ...base,
        chat: await createChat({
          connectionResource,
          id: deps.chatId ?? v7(),
          tabId: tab.id,
        }),
      }
    }

    return base
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title(
              tabTitle(loaderData.tab, loaderData.section),
              loaderData.connection.name,
              loaderData.connectionResource.name
            ),
          },
        ]
      : [],
  }),
})

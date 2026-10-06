import { enabledFilters } from '@tamery/shared/filters'

import { prefetchConnectionResourceTableCore } from '~/core/connection/fetching'
import type { ConnectionResource } from '~/core/connection/sync'
import type { TabView, WorkspaceModule } from '~/lib/module'

import { RecentTables } from './components/recent-tables'
import { TableRefresh } from './components/table-refresh'
import { tablePageStore } from './lib/store'
import type { TableParams } from './lib/tab'
import { TableTab } from './table-tab'

const prefetch = (
  connectionResource: ConnectionResource,
  params: TableParams
) => {
  const { filters, orderBy } = tablePageStore({
    id: connectionResource.id,
    ...params,
  }).get()

  prefetchConnectionResourceTableCore({
    connectionResource,
    query: { exact: false, filters: enabledFilters(filters), orderBy },
    ...params,
  })
}

const tableView: TabView<TableParams> = {
  Content: TableTab,
  Refresh: TableRefresh,
  load: ({ connectionResource, params }) =>
    prefetch(connectionResource, params),
  prefetch,
}

export default {
  emptyPane: [{ Component: RecentTables, order: 0 }],
  tabs: { table: tableView },
} satisfies WorkspaceModule

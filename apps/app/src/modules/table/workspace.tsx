import { enabledFilters } from '@tamery/shared/filters'

import { prefetchConnectionResourceTableCore } from '~/core/connection/fetching'
import type { TabView, WorkspaceModule } from '~/lib/module'

import { RecentTables } from './components/recent-tables'
import { TableRefresh } from './components/table-refresh'
import { ReferenceTable } from './components/table/reference-table'
import { tablePageStore } from './lib/store'
import type { TableParams } from './lib/tab'
import { TableTab } from './table-tab'

const tableView: TabView<TableParams> = {
  Content: TableTab,
  Refresh: TableRefresh,
  load: ({ connectionResource, params, search }) => {
    const store = tablePageStore({ id: connectionResource.id, ...params })

    if (search.filters) {
      const { filters } = search
      store.set((current) => ({ ...current, filters }))
    }
    if (search.orderBy) {
      const { orderBy } = search
      store.set((current) => ({ ...current, orderBy }))
    }

    const pageState = store.get()

    prefetchConnectionResourceTableCore({
      connectionResource,
      query: {
        exact: false,
        filters: enabledFilters(pageState.filters),
        orderBy: pageState.orderBy,
      },
      ...params,
    })
  },
  prefetch: (connectionResource, params) => {
    const { filters, orderBy } = tablePageStore({
      id: connectionResource.id,
      ...params,
    }).get()

    prefetchConnectionResourceTableCore({
      connectionResource,
      query: { exact: false, filters, orderBy },
      ...params,
    })
  },
}

export default {
  emptyPane: [{ Component: RecentTables, order: 0 }],
  referenceTable: ReferenceTable,
  tabs: { table: tableView },
} satisfies WorkspaceModule

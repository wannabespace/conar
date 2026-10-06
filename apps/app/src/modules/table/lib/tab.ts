import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { createWebStorageValue } from 'seitu/web'

import { parseTableTabId } from '~/core/tabs/ids'
import type { TabKind } from '~/lib/module'

import { tablePageStore } from './store'

export interface TableParams {
  schema: string
  table: string
}

const MAX_RECENT_TABLES = 5

export const recentTables = memoize((resourceId: string) =>
  createWebStorageValue({
    defaultValue: [],
    key: `recent-tables-${resourceId}`,
    schema: type({ schema: 'string', table: 'string' }).array(),
    type: 'localStorage',
  })
)

const fullTitle = ({ schema, table }: TableParams) => `${schema}.${table}`

export const tableTab: TabKind<TableParams> = {
  fullTitle,
  icon: LayoutTable02Icon,
  label: (params, siblings) =>
    new Set(siblings.map((sibling) => sibling.schema)).size > 1
      ? fullTitle(params)
      : params.table,
  match: parseTableTabId,
  onActivate: (resourceId, { schema, table }) =>
    recentTables(resourceId).set((recent) =>
      [
        { schema, table },
        ...recent.filter(
          (item) => item.schema !== schema || item.table !== table
        ),
      ].slice(0, MAX_RECENT_TABLES)
    ),
  onRename: (resourceId, from, to) => {
    const source = tablePageStore({ id: resourceId, ...from })
    tablePageStore({ id: resourceId, ...to }).set(source.get())
    source.clear()
    recentTables(resourceId).set((recent) =>
      recent.map((item) =>
        item.schema === from.schema && item.table === from.table ? to : item
      )
    )
  },
  title: ({ table }) => table,
  type: 'table',
}

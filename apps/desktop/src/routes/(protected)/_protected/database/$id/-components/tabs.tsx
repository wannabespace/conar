import type { Database } from '~/lib/indexeddb'
import { Tabs, TabsList, TabsTrigger } from '@connnect/ui/components/tabs'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ensureDatabaseTableCore } from '~/entities/database'
import { getTableStoreState } from '../tables.$schema/$table'

export function TablesTabs({ database, id, ensureTab, tabs }: { database: Database, id: string, ensureTab: (schema: string, table: string) => void, tabs: { table: string, schema: string, order: number }[] }) {
  const { schema: schemaParam, table: tableParam } = useParams({ strict: false })
  const navigate = useNavigate()

  function getQueryOpts(tableName: string) {
    const state = schemaParam ? getTableStoreState(schemaParam, tableName) : null

    if (state) {
      return {
        filters: state.filters,
        orderBy: state.orderBy,
      }
    }

    return {
      filters: [],
      orderBy: {},
    }
  }

  return (
    <div className="h-8">
      <Tabs value={tableParam}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.table}
              value={tab.table}
              onClick={() => navigate({ to: `/database/${id}/tables/${tab.schema}/${tab.table}` })}
              onMouseOver={() => ensureDatabaseTableCore(database, tab.schema, tab.table, getQueryOpts(tab.table))}
            >
              {tab.table}
            </TabsTrigger>
          ))}
          {schemaParam && tableParam && !tabs.find(tab => tab.table === tableParam && tab.schema === schemaParam) && (
            <TabsTrigger
              value={tableParam!}
              onClick={() => navigate({ to: `/database/${id}/tables/${schemaParam}/${tableParam}` })}
              onDoubleClick={() => ensureTab(schemaParam, tableParam)}
            >
              {tableParam}
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  )
}

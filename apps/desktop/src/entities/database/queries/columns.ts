import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { columnsSql, columnType } from '../sql/columns'

export function databaseColumnsQuery(database: Database, table: string, schema: string) {
  const queryMap: Record<DatabaseType, () => Promise<{
    table: string
    name: string
    type: string
    isEditable: boolean
    isNullable: boolean
    default: string | null
  }[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: columnsSql(schema, table)[database.type],
      })

      return result.rows.map(row => columnType.assert(row)).map(column => ({
        ...column,
        isEditable: column.editable,
        isNullable: column.nullable,
      }))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, schema, 'table', table, 'columns'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseColumns(database: Database, table: string, schema: string) {
  return useQuery(databaseColumnsQuery(database, table, schema))
}

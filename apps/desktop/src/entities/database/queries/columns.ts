import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'
import { columnsSql, columnType } from '../sql/columns'

export function databaseColumnsQuery(database: Database, table: string, schema: string) {
  return queryOptions({
    queryKey: ['database', database.id, 'schema', schema, 'table', table, 'columns'],
    queryFn: async () => {
      const [result] = await dbQuery({
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
  })
}

export function useDatabaseColumns(...params: Parameters<typeof databaseColumnsQuery>) {
  return useQuery(databaseColumnsQuery(...params))
}

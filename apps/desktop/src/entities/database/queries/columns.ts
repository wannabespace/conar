import type { Database } from '~/lib/indexeddb'
import { useQuery } from '@tanstack/react-query'
import { databaseContextQuery } from './context'

export function useDatabaseColumns(
  database: Database,
  table: string,
  schema: string,
) {
  return useQuery({
    ...databaseContextQuery(database),
    select: (data) => {
      const columns = data.schemas.find(({ schema: s }) => s === schema)?.tables.find(({ name }) => name === table)?.columns

      if (!columns)
        return []

      return columns.map(({ editable, nullable, ...column }) => ({
        ...column,
        isEditable: editable,
        isNullable: nullable,
      }))
    },
  })
}

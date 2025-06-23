import { useQuery } from '@tanstack/react-query'
import { databaseContextQuery } from './context'

export function useDatabaseTablesAndSchemas(...params: Parameters<typeof databaseContextQuery>) {
  return useQuery({
    ...databaseContextQuery(...params),
    select: (data) => {
      const schemas = data.schemas.map(({ schema, tables }) => ({
        name: schema,
        tables: tables.map(table => table.name),
      }))

      return {
        totalSchemas: schemas.length,
        totalTables: data.schemas.reduce((acc, { tables }) => acc + tables.length, 0),
        schemas,
      }
    },
  })
}

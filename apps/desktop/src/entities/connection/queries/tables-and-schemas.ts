import type { connections } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { tablesAndSchemasQuery } from '../sql/tables-and-schemas'

export function connectionTablesAndSchemasQuery({ connection }: { connection: typeof connections.$inferSelect }) {
  return queryOptions({
    queryKey: ['connection', connection.id, 'tables-and-schemas'],
    queryFn: async () => {
      const results = await tablesAndSchemasQuery(connection)
      const schemas = Object.entries(Object.groupBy(results, table => table.schema)).map(([schema, tables]) => ({
        name: schema,
        tables: tables!.map(table => table.table),
      }))

      return {
        totalSchemas: schemas.length,
        totalTables: schemas.reduce((acc, schema) => acc + schema.tables.length, 0),
        schemas: schemas.toSorted((a, b) => {
          if (a.name === 'public' && b.name !== 'public')
            return -1
          if (b.name === 'public' && a.name !== 'public')
            return 1
          return a.name.localeCompare(b.name)
        }),
      }
    },
  })
}

export function useConnectionTablesAndSchemas(...params: Parameters<typeof connectionTablesAndSchemasQuery>) {
  return useQuery(connectionTablesAndSchemasQuery(...params))
}

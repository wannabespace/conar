import type { databases } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { tablesAndSchemasSql } from '../sql/tables-and-schemas'

export function tablesAndSchemasQuery({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['database', database.id, 'tables-and-schemas'],
    queryFn: async () => {
      const results = await tablesAndSchemasSql(database)
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

export function useDatabaseTablesAndSchemas(...params: Parameters<typeof tablesAndSchemasQuery>) {
  return useQuery(tablesAndSchemasQuery(...params))
}

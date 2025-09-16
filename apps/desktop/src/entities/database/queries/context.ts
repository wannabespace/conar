import type { databases } from '~/drizzle'
import { tablesAndSchemasSql, tablesAndSchemasType } from '@conar/shared/sql/tables-and-schemas'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'

export function tablesAndSchemasQuery({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['database', database.id, 'tables-and-schemas'],
    queryFn: async () => {
      const [result] = await dbQuery(database.id, {
        query: tablesAndSchemasSql()[database.type],
      })

      const schemas = tablesAndSchemasType.assert(result!.rows)

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

import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

const enumSchema = z.object({
  schema: z.string(),
  name: z.string(),
  value: z.string(),
})

export function databaseEnumsQuery(database: Database) {
  const queryMap: Record<DatabaseType, () => Promise<z.infer<typeof enumSchema>[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT n.nspname AS enum_schema,
            t.typname AS enum_name,
            e.enumlabel AS enum_value
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
          ORDER BY enum_schema, enum_name, e.enumsortorder;
        `,
      })

      return result.rows.map(row => enumSchema.parse(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseEnums(database: Database) {
  return useQuery(databaseEnumsQuery(database))
}

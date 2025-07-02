import type { Database } from '~/lib/indexeddb'
import { databaseContextSchema } from '@conar/shared/database'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'
import { contextSql } from '../sql/context'

export function databaseContextQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'context'],
    queryFn: async () => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: contextSql()[database.type],
      })

      const parsed = databaseContextSchema.parse(result.rows[0].database_context)

      return {
        ...parsed,
        schemas: parsed.schemas.toSorted((a, b) => {
          if (a.schema === 'public' && b.schema !== 'public')
            return -1
          if (b.schema === 'public' && a.schema !== 'public')
            return 1
          return a.schema.localeCompare(b.schema)
        }),
      }
    },
  })
}

export function useDatabaseContext(...params: Parameters<typeof databaseContextQuery>) {
  return useQuery(databaseContextQuery(...params))
}

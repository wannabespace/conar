import type { databases } from '~/drizzle'
import { constraintsSql, constraintsType } from '@conar/shared/sql/constraints'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'

export function databaseTableConstraintsQuery({ database, schema, table }: { database: typeof databases.$inferSelect, schema: string, table: string }) {
  return queryOptions({
    queryKey: ['database', database.id, 'constraints', schema, table],
    queryFn: async () => {
      const [result] = await dbQuery(database.id, {
        query: constraintsSql(schema, table)[database.type],
      })

      return result!.rows.map(row => constraintsType.assert(row))
    },
  })
}

export function useDatabaseTableConstraints(...params: Parameters<typeof databaseTableConstraintsQuery>) {
  return useQuery(databaseTableConstraintsQuery(...params))
}

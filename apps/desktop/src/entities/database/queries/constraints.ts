import type { databases } from '~/drizzle'
import { constraintsSql, constraintsType } from '@conar/shared/sql/constraints'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/entities/database/query'

export function databaseConstraintsQuery({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['database', database.id, 'constraints'],
    queryFn: async () => {
      const [result] = await dbQuery(database.id, {
        label: 'Constraints',
        query: constraintsSql()[database.type],
      })

      return result!.rows.map(row => constraintsType.assert(row))
    },
  })
}

export function useDatabaseConstraints(...params: Parameters<typeof databaseConstraintsQuery>) {
  return useQuery(databaseConstraintsQuery(...params))
}

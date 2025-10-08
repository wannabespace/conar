import type { databases } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { constraintsSql } from '../sql/constraints'

export function databaseConstraintsQuery({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['database', database.id, 'constraints'],
    queryFn: () => constraintsSql(database),
  })
}

export function useDatabaseConstraints(...params: Parameters<typeof databaseConstraintsQuery>) {
  return useQuery(databaseConstraintsQuery(...params))
}

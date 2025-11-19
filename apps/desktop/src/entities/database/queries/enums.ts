import type { databases } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { enumsQuery } from '../sql/enums'

export function databaseEnumsQuery({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: () => enumsQuery.run(database),
  })
}

export function useDatabaseEnums(...params: Parameters<typeof databaseEnumsQuery>) {
  return useQuery(databaseEnumsQuery(...params))
}

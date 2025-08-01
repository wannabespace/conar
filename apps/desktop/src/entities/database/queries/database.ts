import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { desc, eq } from 'drizzle-orm'
import { databases, db } from '~/drizzle'

export function databasesQuery() {
  return queryOptions({
    queryKey: ['databases'],
    queryFn: () => db.select().from(databases).orderBy(desc(databases.createdAt)),
  })
}

export function useDatabases() {
  return useQuery(databasesQuery())
}

export function databaseQuery(id: string) {
  return queryOptions({
    queryKey: ['database', id],
    queryFn: async () => {
      const [database] = await db.select().from(databases).where(eq(databases.id, id)).limit(1)

      if (!database) {
        throw new Error('Database not found')
      }

      return database
    },
  })
}

export function useDatabase(...params: Parameters<typeof databaseQuery>) {
  return useSuspenseQuery(databaseQuery(...params))
}

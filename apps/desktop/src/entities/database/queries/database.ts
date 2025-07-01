import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { indexedDb } from '~/lib/indexeddb'

export function databasesQuery() {
  return queryOptions({
    queryKey: ['databases'],
    queryFn: () => indexedDb.databases.orderBy('createdAt').reverse().toArray(),
  })
}

export function useDatabases() {
  return useQuery(databasesQuery())
}

export function databaseQuery(id: string) {
  return queryOptions({
    queryKey: ['database', id],
    queryFn: async () => {
      const database = await indexedDb.databases.get(id)

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

import type { Subscription } from 'dexie'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { liveQuery } from 'dexie'
import { useEffect } from 'react'
import { indexedDb } from '~/lib/indexeddb'
import { queryClient } from '~/main'
import { getDatabaseContext } from '../lib'

export function databasesQuery() {
  return queryOptions({
    queryKey: ['databases'],
    queryFn: () => indexedDb.databases.orderBy('createdAt').reverse().toArray(),
  })
}

let subscription: Subscription | null = null

export function useDatabases() {
  const query = useQuery(databasesQuery())

  useEffect(() => {
    if (subscription)
      return

    subscription = liveQuery(() => indexedDb.databases.toArray()).subscribe(() => {
      queryClient.invalidateQueries({ queryKey: databasesQuery().queryKey })
    })

    return () => {
      subscription?.unsubscribe()
      subscription = null
    }
  }, [])

  return query
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

const subscriptions: Record<string, Subscription> = {}

export function useDatabase(id: string) {
  const query = useSuspenseQuery(databaseQuery(id))

  useEffect(() => {
    if (subscriptions[id])
      return

    subscriptions[id] = liveQuery(() => indexedDb.databases.get(id)).subscribe(() => {
      queryClient.invalidateQueries({ queryKey: databaseQuery(id).queryKey })
    })

    return () => {
      subscriptions[id]?.unsubscribe()
      delete subscriptions[id]
    }
  }, [id])

  return query
}

export function databaseContextQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'context'],
    queryFn: () => getDatabaseContext(database),
  })
}

export function useDatabaseContext(database: Database) {
  return useQuery(databaseContextQuery(database))
}

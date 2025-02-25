import type { Subscription } from 'dexie'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { liveQuery } from 'dexie'
import { useEffect } from 'react'
import { indexedDb } from '~/lib/indexeddb'
import { queryClient } from '~/main'

export function connectionsQuery() {
  return queryOptions({
    queryKey: ['connections'],
    queryFn: () => indexedDb.connections.toArray(),
  })
}

export function connectionQuery(id: string) {
  return queryOptions({
    queryKey: ['connection', id],
    queryFn: () => indexedDb.connections.get(id),
  })
}

let subscription: Subscription | null = null

export function useConnections() {
  const query = useQuery(connectionsQuery())

  useEffect(() => {
    subscription ||= liveQuery(() => indexedDb.connections.toArray()).subscribe(() => {
      queryClient.invalidateQueries({ queryKey: connectionsQuery().queryKey })
    })

    return () => subscription?.unsubscribe()
  }, [])

  return query
}

const subscriptions: Record<string, Subscription> = {}

export function useConnection(id: string) {
  const query = useQuery(connectionQuery(id))

  useEffect(() => {
    subscriptions[id] ||= liveQuery(() => indexedDb.connections.get(id)).subscribe(() => {
      queryClient.invalidateQueries({ queryKey: connectionQuery(id).queryKey })
    })

    return () => subscriptions[id]?.unsubscribe()
  }, [id])

  return query
}

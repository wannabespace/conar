import type { Subscription } from 'dexie'
import { queryOptions, useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { liveQuery } from 'dexie'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { indexedDb } from '~/lib/indexeddb'
import { queryClient } from '~/main'
import { updateConnectionPassword } from '../lib'

export function connectionsQuery() {
  return queryOptions({
    queryKey: ['connections'],
    queryFn: () => indexedDb.connections.orderBy('createdAt').reverse().toArray(),
  })
}

let subscription: Subscription | null = null

export function useConnections() {
  const query = useQuery(connectionsQuery())

  useEffect(() => {
    if (subscription)
      return

    subscription = liveQuery(() => indexedDb.connections.toArray()).subscribe(() => {
      queryClient.invalidateQueries({ queryKey: connectionsQuery().queryKey })
    })

    return () => {
      subscription?.unsubscribe()
      subscription = null
    }
  }, [])

  return query
}

export function connectionQuery(id: string) {
  return queryOptions({
    queryKey: ['connection', id],
    queryFn: async () => {
      const connection = await indexedDb.connections.get(id)

      if (!connection) {
        throw new Error('Connection not found')
      }

      return connection
    },
    throwOnError: true,
  })
}

const subscriptions: Record<string, Subscription> = {}

export function useConnection(id: string) {
  const query = useSuspenseQuery(connectionQuery(id))

  useEffect(() => {
    if (subscriptions[id])
      return

    subscriptions[id] = liveQuery(() => indexedDb.connections.get(id)).subscribe(() => {
      queryClient.invalidateQueries({ queryKey: connectionQuery(id).queryKey })
    })

    return () => {
      subscriptions[id]?.unsubscribe()
      delete subscriptions[id]
    }
  }, [id])

  return query
}

export function useUpdateConnectionPassword(id: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      await updateConnectionPassword(id, password)
    },
    onSuccess: () => {
      toast.success('Password successfully saved!')
    },
  })
}

export function useTestConnection() {
  return useMutation({
    mutationFn: window.electron.connections.test,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Connection successful. You can now save the connection.')
    },
  })
}

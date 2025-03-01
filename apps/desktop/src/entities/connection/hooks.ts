import type { Subscription } from 'dexie'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { liveQuery } from 'dexie'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { indexedDb } from '~/lib/indexeddb'
import { queryClient } from '~/main'
import { updatePassword } from './lib'

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

export function useUpdateConnectionPassword(id: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      await updatePassword(id, password)
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

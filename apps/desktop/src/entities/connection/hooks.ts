import type { ConnectionType } from '@connnect/shared/enums/connection-type'
import type { Subscription } from 'dexie'
import type { Connection } from '~/lib/indexeddb'
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

export function connectionQuery(id: string) {
  return queryOptions({
    queryKey: ['connection', id],
    queryFn: () => indexedDb.connections.get(id),
  })
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

export function connectionInfoQuery(connection: Connection, schema = 'public') {
  return queryOptions({
    queryKey: ['connection', 'info', connection.id],
    queryFn: async () => {
      const queryMap: Record<ConnectionType, string> = {
        postgres: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = '${schema}'
          ORDER BY table_name;
        `,
      }

      const response = await window.electron.connections.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: queryMap[connection.type],
      })

      return response as {
        table_name: string
      }[]
    },
  })
}

export function useConnectionInfo(connection: Connection, schema = 'public') {
  return useQuery(connectionInfoQuery(connection, schema))
}

export function columnsInfoQuery(connection: Connection, table: string) {
  return queryOptions({
    queryKey: ['table', connection.id, table],
    queryFn: async () => {
      if (!connection)
        return null!

      const result = await window.electron.connections.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: `SELECT
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable
        FROM
          information_schema.columns
        WHERE
          table_name = '${table}'
        ORDER BY
          ordinal_position;`,
      })

      return result as {
        column_name: string
        data_type: string
        character_maximum_length: number
        column_default: string
        is_nullable: string
      }[]
    },
  })
}

export function enumsInfoQuery(connection: Connection, table: string) {
  return queryOptions({
    queryKey: ['connection', 'enums', connection.id, table],
    queryFn: async () => {
      const response = await window.electron.connections.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: `
          SELECT n.nspname AS enum_schema,
            t.typname AS enum_name,
            e.enumlabel AS enum_value
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
          ORDER BY enum_schema, enum_name, e.enumsortorder;
        `,
      })

      return response as {
        enum_schema: string
        enum_name: string
        enum_value: string
      }[]
    },
  })
}

export function useEnumsInfo(connection: Connection, table: string) {
  return useQuery(enumsInfoQuery(connection, table))
}

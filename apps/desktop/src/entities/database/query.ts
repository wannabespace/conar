import type { DatabaseType } from '@conar/shared/enums/database-type'
import { Store } from '@tanstack/react-store'
import posthog from 'posthog-js'
import { databasesCollection } from '~/entities/database'
import { orpc } from '../../lib/orpc'

export interface QueryLog {
  id: string
  query: string
  createdAt: Date
  values?: unknown[]
  result: unknown
  label: string
  error: string | null
}

export const queriesLogStore = new Store<Record<string, Record<string, QueryLog>>>({})

export function dbQuery(databaseId: string, params: {
  query: string
  values?: unknown[]
  label: string
}) {
  const database = databasesCollection.get(databaseId)

  if (!database) {
    throw new Error('Database not found')
  }

  const queryId = crypto.randomUUID()

  queriesLogStore.setState(state => ({
    ...state,
    [databaseId]: {
      ...(state[databaseId] || {}),
      [queryId]: {
        id: queryId,
        createdAt: new Date(),
        query: params.query,
        values: params.values,
        result: null,
        error: null,
        label: params.label,
      },
    },
  }))

  if (!window.electron) {
    return orpc.proxy.databases[database.type].query({
      connectionString: database.connectionString,
      ...params,
    })
      .then((result) => {
        if (queriesLogStore.state[databaseId]?.[queryId]) {
          queriesLogStore.setState(state => ({
            ...state,
            [databaseId]: {
              ...state[databaseId]!,
              [queryId]: {
                ...state[databaseId]![queryId]!,
                query: params.query,
                values: params.values,
                result,
                error: null,
                label: params.label,
              },
            },
          }))
        }
        return result
      })
      .catch((err) => {
        const error = err instanceof Error ? err.message : String(err)

        console.error('dbQuery error', database.type, params.query, error)
        posthog.capture('database_query_error', {
          type: database.type,
          query: params.query,
          values: params.values,
          error,
        })
        if (queriesLogStore.state[databaseId]?.[queryId]) {
          queriesLogStore.setState(state => ({
            ...state,
            [databaseId]: {
              ...state[databaseId]!,
              [queryId]: {
                ...state[databaseId]![queryId]!,
                query: params.query,
                values: params.values,
                result: null,
                error,
                label: params.label,
              },
            },
          }))
        }
        throw err
      })
  }

  return window.electron.databases.query({
    type: database.type,
    connectionString: database.connectionString,
    ...params,
  })
    .then((result) => {
      if (queriesLogStore.state[databaseId]?.[queryId]) {
        queriesLogStore.setState(state => ({
          ...state,
          [databaseId]: {
            ...state[databaseId]!,
            [queryId]: {
              ...state[databaseId]![queryId]!,
              query: params.query,
              values: params.values,
              result,
              error: null,
              label: params.label,
            },
          },
        }))
      }
      return result
    })
    .catch((err) => {
      const error = err instanceof Error ? err.message : String(err)

      console.error('dbQuery error', database.type, params.query, error)
      posthog.capture('database_query_error', {
        type: database.type,
        query: params.query,
        values: params.values,
        error,
      })
      if (queriesLogStore.state[databaseId]?.[queryId]) {
        queriesLogStore.setState(state => ({
          ...state,
          [databaseId]: {
            ...state[databaseId]!,
            [queryId]: {
              ...state[databaseId]![queryId]!,
              query: params.query,
              values: params.values,
              result: null,
              error,
              label: params.label,
            },
          },
        }))
      }
      throw err
    })
}

export function dbTestConnection(params: {
  type: DatabaseType
  connectionString: string
}) {
  if (!window.electron) {
    return orpc.proxy.databases[params.type].test({
      connectionString: params.connectionString,
    })
  }

  return window.electron.databases.test(params)
}

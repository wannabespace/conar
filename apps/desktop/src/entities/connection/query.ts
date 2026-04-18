import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Type } from 'arktype'
import type { connectionsResources } from '~/drizzle/schema'
import { isReconnectError } from '@conar/shared/utils/connections'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Result } from 'better-result'
import { createStore } from 'seitu'
import { toast } from 'sonner'
import { dialects } from './dialects'
import { logQuery } from './log'
import { connectionsCollection } from './sync'
import { getConnectionStringToShow } from './utils'

export function connectionResourceToQueryParams(connectionResource: typeof connectionsResources.$inferSelect): QueryParams {
  const connection = connectionsCollection.get(connectionResource.connectionId)!
  const newConnectionString = new SafeURL(connection.connectionString)
  newConnectionString.pathname = connectionResource.name || ''

  return {
    connectionString: newConnectionString.toString(),
    type: connection.type,
    resourceId: connectionResource.id,
    log: ({ promise, query, values }) => logQuery({ resourceId: connectionResource.id, promise, query, values }),
  }
}

export interface QueryParams {
  connectionString: string
  type: ConnectionType
  resourceId?: string
  log?: (params: {
    promise: Promise<{
      result: unknown
      duration: number
    }>
    query: string
    values?: unknown[]
  }) => void
}

export const MAX_RECONNECTION_ATTEMPTS = 5
const RECONNECTION_DELAY = 3000

export const reconnectingPromises = createStore<Record<string, {
  promise: Promise<unknown>
  resourceId?: string
  attempt: number
}>>({})

export function createQuery<T extends Type = Type<unknown>>(options: {
  type?: T
  query: {
    [D in ConnectionType]: (dialect: ReturnType<typeof dialects[D]>) => Promise<
      T extends Type ? T['inferIn'] : unknown
    >
  }
}) {
  const run = async (queryParams: QueryParams): Promise<
    T extends Type ? T['inferOut'] : unknown
  > => {
    const dialect = dialects[queryParams.type]
    const instance = dialect({
      connectionString: queryParams.connectionString,
      log: queryParams.log,
    })
    const queryFn = options.query[queryParams.type]

    const connectionStringToShow = getConnectionStringToShow(queryParams.connectionString, {
      withPathname: true,
      withProtocol: true,
    })
    let attempt = 0

    const resolvers = Promise.withResolvers()

    const canShowToast = () => queryParams.resourceId ? location.href.includes(queryParams.resourceId) : false

    const result = await Result.tryPromise({
      try: async () => {
        const retryPromise = reconnectingPromises.get()[queryParams.connectionString]

        if (attempt === 0 && retryPromise) {
          await retryPromise.promise
        }

        // eslint-disable-next-line ts/no-explicit-any
        return queryFn(instance as any)
      },
      catch: (error) => {
        if (isReconnectError(error)) {
          attempt += 1

          reconnectingPromises.set((state) => {
            const existing = state[queryParams.connectionString] || { promise: resolvers.promise, resourceId: queryParams.resourceId, attempt }

            return {
              ...state,
              [queryParams.connectionString]: existing
                ? {
                    ...existing,
                    attempt,
                  }
                : {
                    promise: resolvers.promise,
                    resourceId: queryParams.resourceId,
                    attempt,
                  },
            }
          })
        }

        return error
      },
    }, {
      retry: {
        times: MAX_RECONNECTION_ATTEMPTS,
        delayMs: RECONNECTION_DELAY,
        backoff: 'constant',
        shouldRetry: isReconnectError,
      },
    })

    if (Result.isOk(result)) {
      resolvers.resolve()
      reconnectingPromises.set((state) => {
        const newState = { ...state }
        delete newState[queryParams.connectionString]
        return newState
      })
      if (canShowToast() && attempt > 0) {
        toast.success(`Database connection successful after reconnection ${attempt} attempt${attempt > 1 ? 's' : ''}.`, {
          id: `reconnection-success-${connectionStringToShow}`,
          description: connectionStringToShow,
        })
      }

      return options.type
        ? options.type.assert(result.value) as T extends Type ? T['inferOut'] : unknown
        : result.value
    }

    if (canShowToast() && isReconnectError(result.error)) {
      toast.error('Could not connect to the database. Please check your network or database server and try again.', {
        id: `reconnection-error-${connectionStringToShow}`,
        description: connectionStringToShow,
      })
    }

    resolvers.reject(result.error)
    reconnectingPromises.set((state) => {
      const newState = { ...state }
      delete newState[queryParams.connectionString]
      return newState
    })

    throw result.error
  }

  return {
    run,
  }
}

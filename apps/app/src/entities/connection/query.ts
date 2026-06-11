import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Type } from 'arktype'
import type { Connection, ConnectionResource } from '~/entities/connection/sync'
import { isConnectionError } from '@conar/shared/utils/connections'
import { Result } from 'better-result'
import { createStore } from 'seitu'
import { toast } from 'sonner'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { dialects } from './dialects'
import { logQuery } from './log'
import { connectionsCollection, connectionsResourcesCollection } from './sync'
import { getConnectionStringToShow } from './utils/helpers'

export function connectionToQueryParams(connection: Connection): QueryParams {
  return {
    type: connection.type,
    connectionId: connection.id,
  }
}

export function connectionResourceToQueryParams(connectionResource: ConnectionResource): QueryParams {
  const connection = connectionsCollection.get(connectionResource.connectionId)!
  return {
    type: connection.type,
    resourceId: connectionResource.id,
    log: ({ promise, query, values }) => logQuery({ resourceId: connectionResource.id, promise, query, values }),
  }
}

export interface QueryParams {
  connectionString?: string
  type: ConnectionType
  resourceId?: string
  connectionId?: string
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

function reconnectKey(params: QueryParams): string {
  return params.resourceId ?? params.connectionId ?? params.connectionString ?? ''
}

function displayLabel(params: QueryParams): string {
  if (params.connectionId) {
    const resource = params.resourceId
      ? connectionsResourcesCollection.get(params.resourceId)
      : undefined
    const info = connectionStringStorage.get(resource?.connectionId ?? params.connectionId)

    if (info?.displayUrl) {
      return info.displayUrl
    }
  }

  if (params.connectionString) {
    return getConnectionStringToShow(params.connectionString, { withPathname: true, withProtocol: true })
  }

  return params.resourceId ?? params.connectionId ?? ''
}

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
      connectionId: queryParams.connectionId,
      resourceId: queryParams.resourceId,
      log: queryParams.log,
    })
    const queryFn = options.query[queryParams.type]

    const label = displayLabel(queryParams)
    const key = reconnectKey(queryParams)
    let attempt = 0

    const resolvers = Promise.withResolvers()

    const canShowToast = () => queryParams.resourceId ? location.href.includes(queryParams.resourceId) : false

    const result = await Result.tryPromise({
      try: async () => {
        const retryPromise = reconnectingPromises.get()[key]

        if (attempt === 0 && retryPromise) {
          await retryPromise.promise
        }

        // eslint-disable-next-line ts/no-explicit-any
        return queryFn(instance as any)
      },
      catch: (error) => {
        if (isConnectionError(error)) {
          attempt += 1

          reconnectingPromises.set((state) => {
            const existing = state[key]

            return {
              ...state,
              [key]: existing
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
        shouldRetry: isConnectionError,
      },
    })

    if (Result.isOk(result)) {
      resolvers.resolve()
      reconnectingPromises.set((state) => {
        const newState = { ...state }
        delete newState[key]
        return newState
      })
      if (canShowToast() && attempt > 0) {
        toast.success(`Database connection successful after reconnection ${attempt} attempt${attempt > 1 ? 's' : ''}.`, {
          id: `reconnection-success-${label}`,
          description: label,
        })
      }

      return options.type
        ? options.type.assert(result.value) as T extends Type ? T['inferOut'] : unknown
        : result.value
    }

    if (canShowToast() && isConnectionError(result.error)) {
      toast.error('Could not connect to the database. Please check your network or database server and try again.', {
        id: `reconnection-error-${label}`,
        description: label,
      })
    }

    resolvers.reject(result.error)
    reconnectingPromises.set((state) => {
      const newState = { ...state }
      delete newState[key]
      return newState
    })

    throw result.error
  }

  return {
    run,
  }
}

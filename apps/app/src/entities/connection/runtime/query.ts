import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { isConnectionError } from '@tamery/shared/utils/connections'
import { sleep } from '@tamery/shared/utils/helpers'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import type { Type } from 'arktype'
import { Result } from 'better-result'
import { createStore } from 'seitu'
import { toast } from 'sonner'

import { getCollections } from '~/entities/collections'
import type { Connection, ConnectionResource } from '~/entities/connection/core'

import { getConnectionStringToShow } from '../utils/helpers'
import { dialects } from './dialects'
import { logQuery } from './log'

export const connectionToQueryParams = async (
  connection: Connection
): Promise<QueryParams> => {
  const { connectionStringsCollection } = getCollections()
  return {
    connectionId: connection.id,
    connectionString: await connectionStringsCollection.utils.decrypt(
      connection.id
    ),
    type: connection.type,
  }
}

export const connectionResourceToQueryParams = async (
  connectionResource: ConnectionResource
): Promise<QueryParams> => {
  const { connectionsCollection, connectionStringsCollection } =
    getCollections()
  const connection = connectionsCollection.get(connectionResource.connectionId)

  if (!connection) {
    throw new Error(
      `Connection not found for connection resource "${connectionResource.id}"`
    )
  }

  const connectionString = new SafeURL(
    await connectionStringsCollection.utils.decrypt(connection.id)
  )
  connectionString.pathname = connectionResource.name || ''

  return {
    connectionString: connectionString.toString(),
    log: ({ promise, query, values }) =>
      logQuery({ promise, query, resourceId: connectionResource.id, values }),
    resourceId: connectionResource.id,
    type: connection.type,
  }
}

export interface QueryParams {
  connectionString: string
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

export const reconnectingPromises = createStore<
  Record<
    string,
    {
      promise: Promise<unknown>
      resourceId?: string
      attempt: number
    }
  >
>({})

export const createQuery = <T extends Type = Type<unknown>>(options: {
  type?: T
  query: {
    [D in ConnectionType]: (
      dialect: ReturnType<(typeof dialects)[D]>
    ) => Promise<T extends Type ? T['inferIn'] : unknown>
  }
}) => {
  const run = async (
    queryParams: QueryParams
  ): Promise<T extends Type ? T['inferOut'] : unknown> => {
    const dialect = dialects[queryParams.type]
    const instance = dialect({
      connectionId: queryParams.connectionId,
      connectionString: queryParams.connectionString,
      log: queryParams.log,
      resourceId: queryParams.resourceId,
    })
    const queryFn = options.query[queryParams.type]

    const connectionStringToShow = getConnectionStringToShow(
      queryParams.connectionString,
      {
        withPathname: true,
        withProtocol: true,
      }
    )
    let attempt = 0

    const resolvers = Promise.withResolvers()

    const canShowToast = () =>
      queryParams.resourceId
        ? location.href.includes(queryParams.resourceId)
        : false

    const [result] = await Promise.all([
      Result.tryPromise(
        {
          catch: (error) => {
            if (isConnectionError(error)) {
              attempt += 1

              reconnectingPromises.set((state) => {
                const existing = state[queryParams.connectionString]

                return {
                  ...state,
                  [queryParams.connectionString]: existing
                    ? {
                        ...existing,
                        attempt,
                      }
                    : {
                        attempt,
                        promise: resolvers.promise,
                        resourceId: queryParams.resourceId,
                      },
                }
              })
            }

            return error
          },
          try: async () => {
            const retryPromise =
              reconnectingPromises.get()[queryParams.connectionString]

            if (attempt === 0 && retryPromise) {
              await retryPromise.promise
            }

            // oxlint-disable-next-line ts/no-explicit-any
            return queryFn(instance as any)
          },
        },
        {
          retry: {
            backoff: 'constant',
            delayMs: RECONNECTION_DELAY,
            shouldRetry: isConnectionError,
            times: MAX_RECONNECTION_ATTEMPTS,
          },
        }
      ),
      sleep(300),
    ])

    if (Result.isOk(result)) {
      resolvers.resolve()
      reconnectingPromises.set((state) => {
        const { [queryParams.connectionString]: _removed, ...remaining } = state
        return remaining
      })
      if (canShowToast() && attempt > 0) {
        toast.success(
          `Database connection successful after reconnection ${attempt} attempt${attempt > 1 ? 's' : ''}.`,
          {
            description: connectionStringToShow,
            id: `reconnection-success-${connectionStringToShow}`,
          }
        )
      }

      return options.type
        ? (options.type.assert(result.value) as T extends Type
            ? T['inferOut']
            : unknown)
        : result.value
    }

    if (canShowToast() && isConnectionError(result.error)) {
      toast.error(
        'Could not connect to the connection. Please check your network or connection server and try again.',
        {
          description: connectionStringToShow,
          id: `reconnection-error-${connectionStringToShow}`,
        }
      )
    }

    resolvers.reject(result.error)
    reconnectingPromises.set((state) => {
      const { [queryParams.connectionString]: _removed, ...remaining } = state
      return remaining
    })

    throw result.error
  }

  return {
    run,
  }
}

import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Type } from 'arktype'
import type { connectionsResources } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { dialects } from './dialects'
import { logQuery } from './log'
import { connectionsCollection } from './sync'

export function connectionResourceToQueryParams(connectionResource: typeof connectionsResources.$inferSelect): QueryParams {
  const connection = connectionsCollection.get(connectionResource.connectionId)!
  const newConnectionString = new SafeURL(connection.connectionString)
  newConnectionString.pathname = connectionResource.name

  return {
    connectionString: newConnectionString.toString(),
    type: connection.type,
    log: ({ promise, query, values }) => logQuery({ resourceId: connectionResource.id, promise, query, values }),
  }
}

export interface QueryParams {
  connectionString: string
  type: ConnectionType
  log?: (params: {
    promise: Promise<{
      result: unknown
      duration: number
    }>
    query: string
    values?: unknown[]
  }) => void
}

export function createQuery<T extends Type = Type<unknown>>(options: {
  type?: T
  /**
   * In case of connection error, the query will not show a toast notification.
   *
   * @default false
   */
  silent?: boolean
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
      silent: options.silent,
    })
    const queryFn = options.query[queryParams.type]
    // eslint-disable-next-line ts/no-explicit-any
    const result = await queryFn(instance as any)

    try {
      return options.type
        ? options.type.assert(result) as T extends Type ? T['inferOut'] : unknown
        : result
    }
    catch (error) {
      console.warn(result)
      throw error
    }
  }

  return {
    run,
  }
}

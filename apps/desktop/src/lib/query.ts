import type { DatabaseType } from '@conar/shared/enums/database-type'
import posthog from 'posthog-js'
import { databasesCollection } from '~/entities/database'
import { orpc } from './orpc'

export function dbQuery(databaseId: string, params: {
  query: string
  values?: unknown[]
}) {
  const database = databasesCollection.get(databaseId)

  if (!database) {
    throw new Error('Database not found')
  }

  if (!window.electron) {
    return orpc.proxy.databases[database.type].query({
      connectionString: database.connectionString,
      ...params,
    }).catch((err) => {
      console.error('dbQuery error', database.type, params.query, err)
      posthog.capture('database_query_error', {
        type: database.type,
        query: params.query,
        values: params.values,
        error: err.message,
      })
      throw err
    })
  }

  return window.electron.databases.query({
    type: database.type,
    connectionString: database.connectionString,
    ...params,
  }).catch((err) => {
    console.error('dbQuery error', database.type, params.query, err)
    posthog.capture('database_query_error', {
      type: database.type,
      query: params.query,
      values: params.values,
      error: err.message,
    })
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

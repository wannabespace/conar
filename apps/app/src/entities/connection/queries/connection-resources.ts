import { eq, queryOnce } from '@tanstack/react-db'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { v7 } from 'uuid'

import { getCollections } from '~/entities/collections'

import type { Connection } from '../core/sync'
import { connectionToQueryParams, createQuery } from '../runtime/query'

const connectionResourcesQuery = createQuery({
  query: {
    clickhouse: async (db) => {
      const rows = await db
        .selectFrom('system.databases')
        .select('name')
        .where('name', 'not in', [
          'INFORMATION_SCHEMA',
          'information_schema',
          'system',
        ])
        .orderBy('name')
        .execute()
      return rows.map((r) => r.name)
    },

    mssql: async (db) => {
      const rows = await db
        .selectFrom('sys.databases')
        .select('name')
        .where('name', 'not in', ['master', 'model', 'msdb', 'tempdb'])
        .orderBy('name')
        .execute()
      return rows.map((r) => r.name)
    },

    mysql: async (db) => {
      const rows = await db
        .selectFrom('information_schema.SCHEMATA')
        .select('SCHEMA_NAME')
        .where('SCHEMA_NAME', 'not in', [
          'information_schema',
          'mysql',
          'performance_schema',
          'sys',
        ])
        .orderBy('SCHEMA_NAME')
        .execute()
      return rows.map((r) => r.SCHEMA_NAME)
    },

    postgres: async (db) => {
      const rows = await db
        .selectFrom('pg_catalog.pg_database')
        .select('datname')
        .where('datistemplate', '=', false)
        .orderBy('datname')
        .execute()
      return rows.map((r) => r.datname)
    },
  },
  type: type('string[]'),
})

export const connectionResourcesQueryOptions = (connection: Connection) =>
  queryOptions({
    queryFn: async () => {
      const { connectionsResourcesCollection } = getCollections()
      const resources = await connectionResourcesQuery.run(
        await connectionToQueryParams(connection)
      )

      await connectionsResourcesCollection.utils.whenSynced()

      const stored = await queryOnce((q) =>
        q
          .from({ resource: connectionsResourcesCollection })
          .where(({ resource }) => eq(resource.connectionId, connection.id))
          .select(({ resource }) => ({ name: resource.name }))
      )
      const storedNames = new Set(stored.map((resource) => resource.name))

      for (const name of resources) {
        if (!storedNames.has(name)) {
          connectionsResourcesCollection.insert({
            connectionId: connection.id,
            createdAt: new Date(),
            id: v7(),
            name,
            updatedAt: new Date(),
          })
        }
      }

      return resources
    },
    queryKey: ['connection', connection.id, 'resources'],
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  })

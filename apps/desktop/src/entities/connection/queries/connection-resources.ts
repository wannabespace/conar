import type { connections } from '~/drizzle'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { type } from 'arktype'
import { useEffect } from 'react'
import { v7 } from 'uuid'
import { createQuery } from '../query'
import { connectionsResourcesCollection } from '../sync'

const query = createQuery({
  type: type('string[]'),
  silent: true,
  query: {
    postgres: db => db
      .selectFrom('pg_catalog.pg_database')
      .select('datname')
      .where('datistemplate', '=', false)
      .orderBy('datname')
      .execute()
      .then(rows => rows.map(r => r.datname)),

    mysql: db => db
      .selectFrom('information_schema.SCHEMATA')
      .select('SCHEMA_NAME')
      .where('SCHEMA_NAME', 'not in', ['information_schema', 'mysql', 'performance_schema', 'sys'])
      .orderBy('SCHEMA_NAME')
      .execute()
      .then(rows => rows.map(r => r.SCHEMA_NAME)),

    mssql: db => db
      .selectFrom('sys.databases')
      .select('name')
      .where('name', 'not in', ['master', 'model', 'msdb', 'tempdb'])
      .orderBy('name')
      .execute()
      .then(rows => rows.map(r => r.name)),

    clickhouse: db => db
      .selectFrom('system.databases')
      .select('name')
      .where('name', 'not in', ['INFORMATION_SCHEMA', 'information_schema', 'system'])
      .orderBy('name')
      .execute()
      .then(rows => rows.map(r => r.name)),
  },
})

export function useConnectionResources(connection: typeof connections.$inferSelect) {
  const { data } = useLiveQuery(q => q
    .from({ connectionsResources: connectionsResourcesCollection })
    .where(({ connectionsResources }) => eq(connectionsResources.connectionId, connection.id)))

  const { mutate: syncResources, isPending } = useMutation({
    mutationFn: async () => {
      const names = await query.run({
        connectionString: connection.connectionString,
        type: connection.type,
      })

      data
        .filter(resource => !names.includes(resource.name))
        .map(resource => connectionsResourcesCollection.delete(resource.id))
      names
        .filter(name => !data.some(resource => resource.name === name))
        .map(name => connectionsResourcesCollection.insert({
          id: v7(),
          createdAt: new Date(),
          updatedAt: new Date(),
          connectionId: connection.id,
          name,
        }))
    },
  })

  useEffect(() => {
    syncResources()
  }, [syncResources])

  return {
    data,
    isPending,
  }
}

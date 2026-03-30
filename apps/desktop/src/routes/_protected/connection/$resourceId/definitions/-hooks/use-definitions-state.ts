import type { connectionsResources } from '~/drizzle/schema'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import { getConnectionResourceStore } from '~/entities/connection/store'

export function useDefinitionsState({ connectionResource }: { connectionResource: typeof connectionsResources.$inferSelect }) {
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const { data } = useQuery(resourceTablesAndSchemasQueryOptions({ silent: false, connectionResource, showSystem }))
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

  return { schemas, selectedSchema, setSelectedSchema, search, setSearch }
}

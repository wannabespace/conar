import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { sectionCapabilitiesOf } from '~/entities/connection/capabilities'
import type { RelationKind } from '~/entities/connection/queries/tables/list'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import type { QueryParams } from '~/entities/connection/runtime/query'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime/query'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'
import type { DefinitionsSection } from '~/entities/connection/store/tabs/types'

const resourceRoute = getRouteApi('/_protected/connection/$resourceId')
const tabRoute = getRouteApi('/_protected/connection/$resourceId/$tabId')

const noTables: string[] = []

export type RunQuery = <T>(query: {
  run: (params: QueryParams) => Promise<T>
}) => Promise<T>

export const useDefinitionsState = ({
  section,
}: {
  section: DefinitionsSection
}) => {
  const { connection, connectionResource } = resourceRoute.useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, {
    selector: (state) => state.showSystem,
  })
  const { data, isPending: structurePending } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem })
  )
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const linkedSchema = tabRoute.useSearch({ select: (search) => search.schema })
  const [pickedSchema, setPickedSchema] = useState<string>()
  const [search, setSearch] = useState('')
  // A link names the schema its row lives in, so it outranks the pick a
  // mounted tab already made — until the page consumes it.
  const selectedSchema =
    [linkedSchema, pickedSchema].find(
      (schema) => schema && schemas.includes(schema)
    ) ?? schemas[0]
  const relationNamesOf = (schema: string, kind: RelationKind) =>
    data?.schemas
      .find(({ name }) => name === schema)
      ?.tables.filter((table) => table.type === kind)
      .map((table) => table.name)
      .toSorted() ?? noTables

  const run: RunQuery = async (query) =>
    query.run(await connectionResourceToQueryParams(connectionResource))

  return {
    can: sectionCapabilitiesOf(section, connection.type),
    connection,
    connectionResource,
    relationNamesOf,
    run,
    schemas,
    search,
    section,
    selectedSchema,
    setSearch,
    setSelectedSchema: setPickedSchema,
    structurePending,
    type: connection.type,
  }
}

export type DefinitionsState = ReturnType<typeof useDefinitionsState>

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { ConnectionResource } from '~/entities/connection/core/sync'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables-and-schemas'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'

export const useDefinitionsState = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) => {
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, {
    selector: (state) => state.showSystem,
  })
  const { data } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem })
  )
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [pickedSchema, setPickedSchema] = useState<string>()
  const [search, setSearch] = useState('')
  const selectedSchema =
    pickedSchema && schemas.includes(pickedSchema) ? pickedSchema : schemas[0]

  return {
    schemas,
    search,
    selectedSchema,
    setSearch,
    setSelectedSchema: setPickedSchema,
  }
}

import { useQuery } from '@tanstack/react-query'
import { databaseColumnsQuery, useDatabase } from '~/entities/database'
import { Route } from '..'
import { usePrimaryKeysQuery } from './use-primary-keys-query'

export function useColumnsQuery() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  return useQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: data => data.map(column => ({
      ...column,
      isPrimaryKey: !!primaryKeys?.includes(column.name),
    })),
  })
}

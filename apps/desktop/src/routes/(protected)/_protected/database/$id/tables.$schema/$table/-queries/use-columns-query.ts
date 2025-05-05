import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { databaseColumnsQuery, useDatabase } from '~/entities/database'
import { usePrimaryKeysQuery } from './use-primary-keys-query'

export function useColumnsQuery() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  return useSuspenseQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: data => data.map(column => ({
      ...column,
      isPrimaryKey: !!primaryKeys?.includes(column.name),
    })),
  })
}

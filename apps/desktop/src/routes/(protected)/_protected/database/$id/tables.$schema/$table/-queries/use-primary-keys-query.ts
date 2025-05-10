import type { Database } from '~/lib/indexeddb'
import { useQuery } from '@tanstack/react-query'
import { databasePrimaryKeysQuery } from '~/entities/database'

export function usePrimaryKeysQuery(database: Database, table: string, schema: string) {
  return useQuery({
    ...databasePrimaryKeysQuery(database),
    select: data => data.find(key => key.table === table && key.schema === schema)?.primaryKeys,
  })
}

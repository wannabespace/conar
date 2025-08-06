import type { databases } from '~/drizzle'
import { useQuery } from '@tanstack/react-query'
import { databasePrimaryKeysQuery } from '~/entities/database'

export function usePrimaryKeysQuery(database: typeof databases.$inferSelect, table: string, schema: string) {
  return useQuery({
    ...databasePrimaryKeysQuery(database),
    select: data => data.find(key => key.table === table && key.schema === schema)?.primaryKeys,
  })
}

import type { connections } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { columnsQuery } from '../sql/columns'

export function connectionTableColumnsQuery({ connection, table, schema }: { connection: typeof connections.$inferSelect, table: string, schema: string }) {
  return queryOptions({
    queryKey: ['connection', connection.id, 'columns', schema, table],
    queryFn: () => columnsQuery(connection, { schema, table }),
  })
}

export function useConnectionTableColumns(...params: Parameters<typeof connectionTableColumnsQuery>) {
  return useQuery(connectionTableColumnsQuery(...params))
}

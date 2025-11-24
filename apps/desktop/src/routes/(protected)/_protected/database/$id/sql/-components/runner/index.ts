import type { databases } from '~/drizzle'
import { queryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { databaseStore, executeSql, hasDangerousSqlKeywords } from '~/entities/database'

export * from './runner'

export function runnerQueryOptions({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['sql', database.id],
    queryFn: async ({ signal }) => {
      const store = databaseStore(database.id)
      const queries = store.state.queriesToRun

      const results = await Promise.all(queries.map(({ query, startLineNumber, endLineNumber }) => executeSql(database, query)
        .then(data => ({
          data: data.rows as Record<string, unknown>[],
          error: null,
          query,
          startLineNumber,
          endLineNumber,
        }))
        .catch(e => ({
          data: null,
          error: e.message,
          query,
          startLineNumber,
          endLineNumber,
        })),
      ))

      if (signal.aborted) {
        return null!
      }

      if (queries.some(({ query }) => hasDangerousSqlKeywords(query))) {
        toast.success('Query executed successfully!')
      }

      return results
    },
    throwOnError: false,
    enabled: false,
  })
}

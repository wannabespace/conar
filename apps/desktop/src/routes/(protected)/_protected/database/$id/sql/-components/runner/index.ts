import type { databases } from '~/drizzle'
import { getErrorMessage } from '@conar/shared/utils/error'
import { queryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hasDangerousSqlKeywords } from '~/entities/database'
import { drizzleProxy } from '~/entities/database/query'
import { databaseStore } from '../../../../-store'

export * from './runner'

export function runnerQueryOptions({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['sql', database.id],
    queryFn: async ({ signal }) => {
      const store = databaseStore(database.id)

      const queries = store.state.queriesToRun

      const db = drizzleProxy(database, 'SQL Runner')
      const results = await Promise.all(queries.map(({ query, startLineNumber, endLineNumber }) => {
        const now = Date.now()
        return db.execute(query)
          .then(data => ({
            data,
            error: null,
            query,
            startLineNumber,
            endLineNumber,
            duration: Date.now() - now,
          }))
          .catch(e => ({
            data: null,
            error: getErrorMessage(e),
            query,
            startLineNumber,
            endLineNumber,
            duration: Date.now() - now,
          }))
      }))

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

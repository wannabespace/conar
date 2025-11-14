import type { databases } from '~/drizzle'
import { getErrorMessage } from '@conar/shared/utils/error'
import { queryOptions } from '@tanstack/react-query'
import { CompiledQuery } from 'kysely'
import { toast } from 'sonner'
import { hasDangerousSqlKeywords, runSql } from '~/entities/database'
import { databaseStore } from '../../../../-store'

export * from './runner'

export function runnerQueryOptions({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['sql', database.id],
    queryFn: async ({ signal }) => {
      const store = databaseStore(database.id)
      const queries = store.state.queriesToRun

      const results = await Promise.all(queries.map(({ query, startLineNumber, endLineNumber }) => runSql({
        database,
        query: {
          postgres: () => CompiledQuery.raw(query),
          mysql: () => CompiledQuery.raw(query),
        },
        label: `SQL Runner (${startLineNumber === endLineNumber ? startLineNumber : `${startLineNumber}-${endLineNumber}`})`,
      })
        .then(data => ({
          data: data.result as Record<string, unknown>[],
          error: null,
          query,
          startLineNumber,
          endLineNumber,
          duration: data.duration,
        }))
        .catch(e => ({
          data: null,
          error: getErrorMessage(e),
          query,
          startLineNumber,
          endLineNumber,
          duration: 0,
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

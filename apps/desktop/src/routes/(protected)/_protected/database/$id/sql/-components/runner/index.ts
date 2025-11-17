import type { databases } from '~/drizzle'
import { queryOptions } from '@tanstack/react-query'
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

      const results = await Promise.all(queries.map(({ query, startLineNumber, endLineNumber }) => runSql(database, {
        query: {
          postgres: ({ execute, log }) => {
            const promise = execute({ sql: query, parameters: [] })

            log({ sql: query, parameters: [], promise, label: `SQL Runner (${startLineNumber === endLineNumber ? startLineNumber : `${startLineNumber}-${endLineNumber}`})` })

            return promise
          },
          mysql: ({ execute, log }) => {
            const promise = execute({ sql: query, parameters: [] })

            log({ sql: query, parameters: [], promise, label: `SQL Runner (${startLineNumber === endLineNumber ? startLineNumber : `${startLineNumber}-${endLineNumber}`})` })

            return promise
          },
        },
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
          error: e.message,
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

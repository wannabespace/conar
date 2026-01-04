import type { databases } from '~/drizzle'
import type { databaseStoreType } from '~/entities/database/store'
import { queryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { executeAndLogSql } from '~/entities/database/sql'
import { databaseStore } from '~/entities/database/store'
import { hasDangerousSqlKeywords } from '~/entities/database/utils'

export * from './runner'

function transformResult({ rows, query, startLineNumber, endLineNumber }: { rows: unknown[] } & Pick<typeof databaseStoreType.infer['queriesToRun'][number], 'query' | 'startLineNumber' | 'endLineNumber'>) {
  return {
    data: rows as Record<string, unknown>[],
    error: null,
    query,
    startLineNumber,
    endLineNumber,
  }
}

function transformError({ error, query, startLineNumber, endLineNumber }: { error: unknown } & Pick<typeof databaseStoreType.infer['queriesToRun'][number], 'query' | 'startLineNumber' | 'endLineNumber'>) {
  return {
    data: null,
    error: error instanceof Error ? error.message : String(error),
    query,
    startLineNumber,
    endLineNumber,
  }
}

export function runnerQueryOptions({ database }: { database: typeof databases.$inferSelect }) {
  const store = databaseStore(database.id)

  return queryOptions({
    queryKey: ['sql', database.id],
    queryFn: async ({ signal }) => {
      const queries = store.state.queriesToRun

      const results: (ReturnType<typeof transformResult> | ReturnType<typeof transformError>)[] = []

      for (const { query, startLineNumber, endLineNumber } of queries) {
        if (signal.aborted) {
          return []
        }

        try {
          const { result } = await executeAndLogSql({ database, sql: query })
          results.push(transformResult({ rows: result as unknown[], query, startLineNumber, endLineNumber }))
        }
        catch (error) {
          results.push(transformError({ error, query, startLineNumber, endLineNumber }))
        }
      }

      const queriesWithDangerousSqlKeywords = queries.filter(({ query }) => hasDangerousSqlKeywords(query))

      if (queriesWithDangerousSqlKeywords.length > 0) {
        const errors = results.filter(({ error }) => error !== null)

        if (errors.length === 0) {
          toast.success(queriesWithDangerousSqlKeywords.length > 1 ? 'All queries executed successfully!' : 'Query executed successfully!')
        }
        else if (errors.length !== results.length) {
          toast.warning(queriesWithDangerousSqlKeywords.length > 1 ? 'Some queries failed to execute!' : 'Query failed to execute!')
        }
        else {
          toast.error(queriesWithDangerousSqlKeywords.length > 1 ? 'All queries failed to execute!' : 'Query failed to execute!')
        }
      }

      return results
    },
    throwOnError: false,
    enabled: false,
  })
}

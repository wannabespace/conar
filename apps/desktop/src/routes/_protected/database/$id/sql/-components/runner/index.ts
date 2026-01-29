import type { connections } from '~/drizzle'
import type { connectionStoreType } from '~/entities/connection/store'
import { queryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { executeAndLogSql } from '~/entities/connection/sql'
import { connectionStore } from '~/entities/connection/store'
import { hasDangerousSqlKeywords } from '~/entities/connection/utils'

export * from './runner'

function transformResult({ rows, query, startLineNumber, endLineNumber, executionTime }: { rows: unknown[], executionTime: number } & Pick<typeof connectionStoreType.infer['queriesToRun'][number], 'query' | 'startLineNumber' | 'endLineNumber'>) {
  return {
    data: rows as Record<string, unknown>[],
    error: null,
    query,
    startLineNumber,
    endLineNumber,
    executionTime,
  }
}

function transformError({ error, query, startLineNumber, endLineNumber, executionTime }: { error: unknown, executionTime: number } & Pick<typeof connectionStoreType.infer['queriesToRun'][number], 'query' | 'startLineNumber' | 'endLineNumber'>) {
  return {
    data: null,
    error: error instanceof Error ? error.message : String(error),
    query,
    startLineNumber,
    endLineNumber,
    executionTime,
  }
}

export function runnerQueryOptions({ connection }: { connection: typeof connections.$inferSelect }) {
  const store = connectionStore(connection.id)

  return queryOptions({
    queryKey: ['sql', connection.id],
    queryFn: async ({ signal }) => {
      const queries = store.state.queriesToRun

      const results: (ReturnType<typeof transformResult> | ReturnType<typeof transformError>)[] = []

      for (const { query, startLineNumber, endLineNumber } of queries) {
        if (signal.aborted) {
          return []
        }

        const startTime = performance.now()
        try {
          const { result } = await executeAndLogSql({ connection, sql: query })
          const executionTime = performance.now() - startTime
          results.push(transformResult({ rows: result as unknown[], query, startLineNumber, endLineNumber, executionTime }))
        }
        catch (error) {
          const executionTime = performance.now() - startTime
          results.push(transformError({ error, query, startLineNumber, endLineNumber, executionTime }))
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

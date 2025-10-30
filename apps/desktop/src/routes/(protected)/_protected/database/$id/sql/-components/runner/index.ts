import type { databases } from '~/drizzle'
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
      const results = await Promise.all(queries.map(({ sql }) => db.execute(sql)
        .then(data => ({
          data,
          error: null,
          sql,
        }))
        .catch(e => ({
          data: null,
          error: (e instanceof Error ? String(e.cause) || e.message : String(e)).replaceAll('Error: ', ''),
          sql,
        }))))

      if (signal.aborted) {
        return null!
      }

      if (queries.some(({ sql }) => hasDangerousSqlKeywords(sql))) {
        toast.success('Query executed successfully!')
      }

      return results
    },
    throwOnError: false,
    enabled: false,
  })
}

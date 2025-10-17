import type { databases } from '~/drizzle'
import { queryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hasDangerousSqlKeywords } from '~/entities/database'
import { drizzleProxy } from '~/entities/database/query'
import { formatSql } from '~/lib/formatter'
import { pageStore } from '../../-page'

export * from './runner'

export function runnerQueryOptions({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['sql', database.id],
    queryFn: async ({ signal }) => {
      let shouldRun = true

      signal.onabort = () => {
        shouldRun = false
      }

      const store = pageStore(database.id)

      const queries = store.state.queriesToRun

      const db = drizzleProxy(database, 'SQL Runner')
      const results = await Promise.all(queries.map(async query => [
        formatSql(query, database.type),
        await db.execute(query).catch(e => (e instanceof Error ? String(e.cause) || e.message : String(e)).replaceAll('Error: ', '')),
      ] as const))

      if (!shouldRun) {
        return null!
      }

      if (queries.some(query => hasDangerousSqlKeywords(query))) {
        toast.success('Query executed successfully!')
      }

      return results
    },
    throwOnError: false,
    enabled: false,
  })
}

import type { databases } from '~/drizzle'
import { localStorageValue } from '@conar/ui/hookas/use-local-storage'
import { queryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hasDangerousSqlKeywords } from '~/entities/database'
import { drizzleProxy } from '~/entities/database/query'
import { pageStore } from '../../-lib'

export * from './runner'

export function runnerQueryOptions({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['sql', database.id],
    queryFn: async ({ signal }) => {
      let shouldRun = true

      signal.onabort = () => {
        shouldRun = false
      }

      const queries = pageStore.state.queriesToRun

      const db = drizzleProxy(database, 'SQL Runner')
      const results = await Promise.all(queries.map(async query => [
        query,
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

export function runnerSql(id: string) {
  return localStorageValue(`sql-${id}`, '')
}

export function runnerSelectedLines(id: string) {
  return localStorageValue<number[]>(`selected-lines-${id}`, [])
}

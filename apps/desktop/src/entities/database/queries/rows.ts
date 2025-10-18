import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import { rowsSql } from '../sql/rows'
import { DEFAULT_LIMIT } from '../utils/helpers'

type Page = Awaited<ReturnType<typeof rowsSql>>[0]

interface PageResult {
  rows: Page[]
}

export function databaseRowsQuery({
  database,
  table,
  schema,
  query,
}: {
  database: typeof databases.$inferSelect
  table: string
  schema: string
  query: { orderBy: Record<string, 'ASC' | 'DESC'>, filters: ActiveFilter[] }
}) {
  return infiniteQueryOptions({
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageResult, _allPages: PageResult[], lastPageParam: number) => {
      return lastPage.rows.length === 0 || lastPage.rows.length < DEFAULT_LIMIT ? null : lastPageParam + DEFAULT_LIMIT
    },
    queryKey: [
      'database',
      database.id,
      'schema',
      schema,
      'table',
      table,
      'rows',
      {
        filters: query.filters,
        orderBy: query.orderBy,
      },
    ],
    queryFn: async ({ pageParam: offset = 0 }) => {
      const result = await rowsSql(database, {
        schema,
        table,
        limit: DEFAULT_LIMIT,
        offset,
        orderBy: query.orderBy,
        filters: query.filters,
      })

      return {
        rows: result,
      } satisfies PageResult
    },
    select: data => data.pages.flatMap(page => page.rows),
    throwOnError: false,
  })
}

export function useDatabaseRows(...params: Parameters<typeof databaseRowsQuery>) {
  return useInfiniteQuery(databaseRowsQuery(...params))
}

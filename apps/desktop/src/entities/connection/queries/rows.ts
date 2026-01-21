import type { ActiveFilter } from '@conar/shared/filters'
import type { connections } from '~/drizzle'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import { rowsQuery } from '../sql/rows'
import { DEFAULT_PAGE_LIMIT } from '../utils/helpers'

type Page = Awaited<ReturnType<typeof rowsQuery>>[number]

interface PageResult {
  rows: Page[]
}

export function connectionRowsQuery({
  connection,
  table,
  schema,
  query,
}: {
  connection: typeof connections.$inferSelect
  table: string
  schema: string
  query: {
    orderBy: Record<string, 'ASC' | 'DESC'>
    filters: ActiveFilter[]
  }
}) {
  return infiniteQueryOptions({
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageResult, _allPages: PageResult[], lastPageParam: number) => {
      return lastPage.rows.length === 0 || lastPage.rows.length < DEFAULT_PAGE_LIMIT ? null : lastPageParam + DEFAULT_PAGE_LIMIT
    },
    queryKey: [
      'connection',
      connection.id,
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
    queryFn: async ({ pageParam: offset }) => {
      const result = await rowsQuery(connection, {
        schema,
        table,
        limit: DEFAULT_PAGE_LIMIT,
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

export function useConnectionRows(...params: Parameters<typeof connectionRowsQuery>) {
  return useInfiniteQuery(connectionRowsQuery(...params))
}

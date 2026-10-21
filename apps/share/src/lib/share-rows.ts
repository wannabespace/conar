import { SHARE_REFRESH_MS } from '@tamery/shared/enums/share-refresh'
import { SHARE_MAX_PAGES } from '@tamery/shared/share'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'

import { getShare, getShareInfo } from './share'

export const shareSearch = type({
  'order?': '"asc" | "desc"',
  'sort?': 'string',
})

export const shareRowsQueryKey = (id: string) => ['share', id]

export const shareInfoQueryOptions = (id: string) =>
  queryOptions({
    queryFn: () => getShareInfo({ data: { id } }),
    queryKey: [...shareRowsQueryKey(id), 'info'],
  })

export const shareRowsQueryOptions = ({
  id,
  search: { order, sort },
}: {
  id: string
  search: typeof shareSearch.infer
}) => {
  const viewerSort = sort
    ? ({ column: sort, direction: order === 'desc' ? 'DESC' : 'ASC' } as const)
    : null
  return infiniteQueryOptions({
    getNextPageParam: (
      last: Awaited<ReturnType<typeof getShare>>,
      _pages,
      page
    ) =>
      last.status === 'ready' && last.hasMore && page < SHARE_MAX_PAGES
        ? page + 1
        : null,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getShare({ data: { id, page: pageParam, sort: viewerSort } }),
    queryKey: [...shareRowsQueryKey(id), viewerSort],
    refetchInterval: ({ state }) => {
      const first = state.data?.pages[0]
      return first?.status === 'ready' ? SHARE_REFRESH_MS[first.refresh] : false
    },
  })
}

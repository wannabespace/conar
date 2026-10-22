import { SHARE_REFRESH_MS } from '@tamery/shared/enums/share-refresh'
import { SHARE_MAX_PAGES } from '@tamery/shared/share'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'

import { getShare, getShareInfo } from './share'

export const shareSearch = type({
  'order?': '"ASC" | "DESC"',
  'sort?': 'string',
})

const shareRowsQueryKey = (id: string) => ['share', id]

export const shareInfoQueryOptions = (id: string) =>
  queryOptions({
    queryFn: () => getShareInfo({ data: { id } }),
    queryKey: [...shareRowsQueryKey(id), 'info'],
  })

export const shareRowsQueryOptions = ({
  id,
  search: { order = 'ASC', sort },
}: {
  id: string
  search: typeof shareSearch.infer
}) => {
  const viewerSort = sort ? { column: sort, direction: order } : null
  return infiniteQueryOptions({
    getNextPageParam: (
      last: Awaited<ReturnType<typeof getShare>>,
      _pages,
      page
    ) => (last.hasMore && page < SHARE_MAX_PAGES ? page + 1 : null),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getShare({ data: { id, page: pageParam, sort: viewerSort } }),
    queryKey: [...shareRowsQueryKey(id), viewerSort],
    // Refetching an infinite query refetches every loaded page, each a read of the owner's database.
    refetchInterval: ({ state }) =>
      state.data?.pages.length === 1 && state.data.pages[0]
        ? SHARE_REFRESH_MS[state.data.pages[0].refresh]
        : false,
  })
}

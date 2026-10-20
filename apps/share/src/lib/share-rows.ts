import { SHARE_REFRESH_MS } from '@tamery/shared/enums/share-refresh'
import type { shareSort } from '@tamery/shared/share'
import { infiniteQueryOptions } from '@tanstack/react-query'

import { getShare } from './share'

export const shareRowsQueryKey = (id: string) => ['share', id]

export const shareRowsQueryOptions = ({
  id,
  sort,
}: {
  id: string
  sort: typeof shareSort.infer
}) =>
  infiniteQueryOptions({
    getNextPageParam: (
      last: Awaited<ReturnType<typeof getShare>>,
      _pages,
      page: number
    ) => (last.status === 'ready' && last.hasMore ? page + 1 : null),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getShare({ data: { id, page: pageParam, sort } }),
    queryKey: [...shareRowsQueryKey(id), sort],
    refetchInterval: ({ state }) => {
      const first = state.data?.pages[0]
      return first?.status === 'ready' ? SHARE_REFRESH_MS[first.refresh] : false
    },
  })

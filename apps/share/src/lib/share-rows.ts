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
  })

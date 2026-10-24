import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { shareRowsQueryOptions } from '~/lib/share-rows'

const route = getRouteApi('/$shareId')

export const useShareRows = () => {
  const { shareId } = route.useParams()
  return useSuspenseInfiniteQuery(shareRowsQueryOptions(shareId))
}

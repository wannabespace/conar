import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useDeferredValue } from 'react'

import { shareRowsQueryOptions } from '~/lib/share-rows'

const route = getRouteApi('/$shareId')

export const useShareRows = () => {
  const { shareId } = route.useParams()
  const search = route.useSearch()
  const shownSearch = useDeferredValue(search)
  const query = useSuspenseInfiniteQuery(
    shareRowsQueryOptions({ id: shareId, search: shownSearch })
  )
  return { ...query, search, sorting: search !== shownSearch }
}

import { queryOptions } from '@tanstack/react-query'

import { getViewer } from './account'

export const viewerQueryOptions = queryOptions({
  queryFn: () => getViewer(),
  queryKey: ['viewer'],
})

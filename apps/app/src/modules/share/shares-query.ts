import { orpc } from '~/lib/orpc'

export const sharesQueryOptions = orpc.shares.list.queryOptions({
  networkMode: 'online',
})

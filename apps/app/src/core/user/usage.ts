import { orpc } from '~/lib/orpc'

export const usageQueryOptions = orpc.usage.get.queryOptions({
  networkMode: 'online',
})

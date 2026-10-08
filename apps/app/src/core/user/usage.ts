import { orpc } from '~/lib/orpc'

export const usageQueryOptions = orpc.usage.queryOptions({
  input: {},
  networkMode: 'online',
})

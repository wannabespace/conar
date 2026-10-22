import type { ORPCOutputs } from '~/lib/orpc'
import { orpc } from '~/lib/orpc'

export type Share = ORPCOutputs['shares']['list'][number]

// Shares are stopped on the share site and a failed list must not take the table down, so this opts out of the app's infinite, throwing defaults.
export const sharesQueryOptions = orpc.shares.list.queryOptions({
  networkMode: 'online',
  staleTime: 0,
  throwOnError: false,
})

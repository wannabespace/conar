import type { ORPCOutputs } from '~/lib/orpc'
import { orpc } from '~/lib/orpc'

export const sharesQueryOptions = orpc.shares.list.queryOptions({
  networkMode: 'online',
})

export type Share = ORPCOutputs['shares']['list'][number]

import { FREE_WEEKLY_LIMITS } from '@tamery/shared/usage'
import { silently, tryCatchAsync } from '@tamery/shared/utils'
import { format } from 'date-fns'
import { createStore } from 'seitu'

import { permix } from '~/core/user/permissions'
import { usageQueryOptions } from '~/core/user/usage'
import { orpc } from '~/lib/orpc'
import { posthog } from '~/lib/posthog'
import { queryClient } from '~/lib/query-client'

export const limitDialog = createStore({ open: false })

const isUnlimited = () => permix.check('mcp.unlimited')

/** Refuses the agent and opens the limit dialog once this week's free `query` and `execute` runs are used up. */
export const assertQuota = async () => {
  if (isUnlimited()) {
    return
  }
  // `networkMode: 'always'`: offline, an 'online' query pauses instead of failing and the agent would hang.
  const { data: usage } = await tryCatchAsync(() =>
    queryClient.fetchQuery({
      ...usageQueryOptions,
      networkMode: 'always',
      staleTime: 0,
    })
  )
  if (!usage?.mcp || usage.mcp.used < usage.mcp.max) {
    return
  }
  posthog.capture('mcp_limit_reached')
  limitDialog.set({ open: true })
  throw new Error(
    `The free plan's ${FREE_WEEKLY_LIMITS.mcp} queries a week through Tamery are used up until ${format(usage.mcp.resetAt, 'EEEE, MMMM d')}. Tell the user that Tamery Pro removes the limit.`
  )
}

export const recordQuery = async () => {
  if (isUnlimited()) {
    return
  }
  await silently(async () => {
    const mcp = await orpc.usage.record.call(
      { feature: 'mcp' },
      { context: { silent: true } }
    )
    queryClient.setQueryData(
      usageQueryOptions.queryKey,
      (usage) => usage && { ...usage, mcp }
    )
  })
}

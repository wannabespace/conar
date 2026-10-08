import { FREE_LIMITS, usageResetsAt } from '@tamery/shared/usage'
import { tryCatchAsync } from '@tamery/shared/utils'
import { queryOptions } from '@tanstack/react-query'
import { format } from 'date-fns'
import { createStore } from 'seitu'

import { permix } from '~/core/user/permissions'
import { orpc } from '~/lib/orpc'
import { posthog } from '~/lib/posthog'
import { queryClient } from '~/lib/query-client'

export const limitDialog = createStore({ open: false })

const usedQueryKey = ['mcp', 'used']

const isUnlimited = () => permix.check('mcp.unlimited')

const deviceUsed = async () => {
  const usage = await window.electron?.mcp.usage()
  return usage && Date.now() < usage.resetsAt ? usage.count : 0
}

const saveUsed = async (count: number) => {
  await window.electron?.mcp.setUsage({
    count,
    resetsAt: usageResetsAt('mcp'),
  })
  queryClient.setQueryData(usedQueryKey, count)
  return count
}

/** The higher count wins: the account's restores a device whose data was cleared; offline, the device's stands. */
const withAccount = async (used: number, record?: 'mcp') => {
  const { data: usage } = await tryCatchAsync(() =>
    orpc.usage.call(record ? { record } : {}, { context: { silent: true } })
  )
  const accountUsed = usage?.mcp?.used ?? 0
  return accountUsed > used ? saveUsed(accountUsed) : used
}

export const usedQueryOptions = queryOptions({
  queryFn: async () => withAccount(await deviceUsed()),
  queryKey: usedQueryKey,
})

/** Refuses the agent and opens the limit dialog once this week's free `query` and `execute` runs are used up. */
export const assertQuota = async () => {
  if (isUnlimited() || (await deviceUsed()) < FREE_LIMITS.mcp.max) {
    return
  }
  posthog.capture('mcp_limit_reached')
  limitDialog.set({ open: true })
  throw new Error(
    `The free plan's ${FREE_LIMITS.mcp.max} queries a week through Tamery are used up until ${format(usageResetsAt('mcp'), 'EEEE, MMMM d')}. Tell the user that Tamery Pro removes the limit.`
  )
}

export const recordQuery = async () => {
  if (isUnlimited()) {
    return
  }
  await withAccount(await saveUsed((await deviceUsed()) + 1), 'mcp')
}

import { FREE_MCP_QUERIES_WEEKLY_LIMIT } from '@tamery/shared/constants'
import { mcpQuotaResetsAt } from '@tamery/shared/mcp'
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
  await window.electron?.mcp.setUsage({ count, resetsAt: mcpQuotaResetsAt() })
  queryClient.setQueryData(usedQueryKey, count)
  return count
}

/** The higher count wins: the account's restores a device whose data was cleared; offline, the device's stands. */
const withAccount = async (
  used: number,
  account: () => Promise<number | null>
) => {
  const { data: accountUsed } = await tryCatchAsync(account)
  return accountUsed && accountUsed > used ? saveUsed(accountUsed) : used
}

const silent = { context: { silent: true } }

export const usedQueryOptions = queryOptions({
  queryFn: async () =>
    withAccount(await deviceUsed(), () =>
      orpc.mcp.usage.call(undefined, silent)
    ),
  queryKey: usedQueryKey,
})

/** Refuses the agent and opens the limit dialog once this week's free `query` and `execute` runs are used up. */
export const assertQuota = async () => {
  if (isUnlimited() || (await deviceUsed()) < FREE_MCP_QUERIES_WEEKLY_LIMIT) {
    return
  }
  posthog.capture('mcp_limit_reached')
  limitDialog.set({ open: true })
  throw new Error(
    `The free plan's ${FREE_MCP_QUERIES_WEEKLY_LIMIT} queries a week through Tamery are used up until ${format(mcpQuotaResetsAt(), 'EEEE, MMMM d')}. Tell the user that Tamery Pro removes the limit.`
  )
}

export const recordQuery = async () => {
  if (isUnlimited()) {
    return
  }
  await withAccount(await saveUsed((await deviceUsed()) + 1), () =>
    orpc.mcp.record.call(undefined, silent)
  )
}

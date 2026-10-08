import type { MeteredFeature } from '@tamery/shared/usage'
import { type } from 'arktype'

import { getUsage, quotaOf, recordUsage } from '~/lib/usage'
import { orpc, permissionsMiddleware } from '~/orpc'

const quotaType = type({ max: 'number', resetAt: 'Date', used: 'number' })

/** Each metered feature's quota this period, `null` where the plan has no limit. `record` counts an MCP run first: devices enforce that limit offline and report here, so clearing one device's data cannot reset it. */
export const usage = orpc
  .use(permissionsMiddleware)
  .input(type({ 'record?': "'mcp'" }))
  .output(type({ filters: quotaType.or('null'), mcp: quotaType.or('null') }))
  .handler(async ({ context, input }) => {
    const userId = context.user.id
    const unlimited = {
      filters: context.permissions.check('ai.filter.unlimited'),
      mcp: context.permissions.check('mcp.unlimited'),
    }
    if (input.record && !unlimited[input.record]) {
      await recordUsage(userId, input.record)
    }
    const quotaFor = async (feature: MeteredFeature) =>
      unlimited[feature]
        ? null
        : quotaOf(feature, await getUsage(userId, feature))
    const [filters, mcp] = await Promise.all([
      quotaFor('filters'),
      quotaFor('mcp'),
    ])
    return { filters, mcp }
  })

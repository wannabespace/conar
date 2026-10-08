import type { MeteredFeature } from '@tamery/shared/usage'
import { type } from 'arktype'

import { getUsage, quotaOf, recordUsage } from '~/lib/usage'
import { orpc, permissionsMiddleware } from '~/orpc'

const quotaType = type({ max: 'number', resetAt: 'Date', used: 'number' })

/** Each metered feature's quota this period, `null` where the plan has no limit. */
export const get = orpc
  .use(permissionsMiddleware)
  .output(type({ filters: quotaType.or('null'), mcp: quotaType.or('null') }))
  .handler(async ({ context }) => {
    const userId = context.user.id
    const unlimited = {
      filters: context.permissions.check('ai.filter.unlimited'),
      mcp: context.permissions.check('mcp.unlimited'),
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

export const record = orpc
  .use(permissionsMiddleware)
  .input(type({ feature: "'mcp'" }))
  .output(quotaType.or('null'))
  .handler(async ({ context, input: { feature } }) =>
    context.permissions.check('mcp.unlimited')
      ? null
      : quotaOf(feature, await recordUsage(context.user.id, feature))
  )

import { type } from 'arktype'

import { usage } from '~/lib/usage'
import { orpc, permissionsMiddleware } from '~/orpc'

const quotaType = type({ max: 'number', resetAt: 'Date', used: 'number' })

/** Each metered feature's quota this period, `null` where the plan has no limit. */
export const get = orpc
  .use(permissionsMiddleware)
  .output(type({ filters: quotaType.or('null'), mcp: quotaType.or('null') }))
  .handler(async ({ context }) => {
    const [filters, mcp] = await Promise.all([
      usage.get(context, 'filters'),
      usage.get(context, 'mcp'),
    ])
    return { filters, mcp }
  })

export const record = orpc
  .use(permissionsMiddleware)
  .input(type({ feature: "'mcp'" }))
  .output(quotaType.or('null'))
  .handler(({ context, input }) => usage.record(context, input.feature))

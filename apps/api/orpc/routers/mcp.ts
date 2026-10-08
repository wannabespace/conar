import { mcpQuotaResetsAt } from '@tamery/shared/mcp'
import { type } from 'arktype'

import { redis } from '~/lib/redis'
import { orpc, permissionsMiddleware } from '~/orpc'

const usageKey = (userId: string, resetsAt: number) =>
  `mcp:usage:${userId}:${resetsAt}`

const countType = type('number | null')

/** The account's agent queries this week, `null` on Pro. Devices enforce the limit offline and report here, so clearing one device's data cannot reset it. */
export const usage = orpc
  .use(permissionsMiddleware)
  .output(countType)
  .handler(async ({ context }) => {
    if (context.permissions.check('mcp.unlimited')) {
      return null
    }
    const count = await redis.get(usageKey(context.user.id, mcpQuotaResetsAt()))
    return Number(count ?? 0)
  })

export const record = orpc
  .use(permissionsMiddleware)
  .output(countType)
  .handler(async ({ context }) => {
    if (context.permissions.check('mcp.unlimited')) {
      return null
    }
    const resetsAt = mcpQuotaResetsAt()
    const key = usageKey(context.user.id, resetsAt)
    const count = await redis.incr(key)
    await redis.expire(key, Math.ceil((resetsAt - Date.now()) / 1000))
    return count
  })

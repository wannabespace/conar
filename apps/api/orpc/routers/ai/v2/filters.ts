import { generateFilters } from '@tamery/ai/filters'
import { FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT } from '@tamery/shared/constants'
import { type } from 'arktype'
import { addDays, differenceInSeconds, endOfMonth, format } from 'date-fns'

import { redis } from '~/lib/redis'
import { optionalSubscriptionMiddleware, orpc } from '~/orpc'

const redisUsage = {
  get: async (userId: string) => {
    const value = await redis.get(
      `ai:usage:${userId}:filters:${format(new Date(), 'yyyy-MM')}`
    )
    return value ? Number(value) : 0
  },
  increment: async (userId: string) => {
    const now = new Date()
    const key = `ai:usage:${userId}:filters:${format(now, 'yyyy-MM')}`
    const value = await redis.incr(key)
    await redis.expire(key, differenceInSeconds(endOfMonth(now), now))
    return value
  },
}

export const filters = orpc
  .use(optionalSubscriptionMiddleware)
  .input(
    type({
      context: 'string',
      prompt: 'string',
    })
  )
  .errors({
    FORBIDDEN: {
      data: type({
        max: 'number',
        remaining: 'number',
        resetAt: 'Date',
      }),
    },
  })
  .handler(async ({ input, signal, context, errors }) => {
    context.addLogData({
      filterInput: input.prompt,
    })

    let usage = 0

    if (!context.subscription) {
      usage = await redisUsage.get(context.user.id)

      if (usage >= FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT) {
        throw errors.FORBIDDEN({
          data: {
            max: FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT,
            remaining: 0,
            resetAt: addDays(endOfMonth(new Date()), 1),
          },
          message:
            'You have reached the free AI usage limit. Please subscribe to a Pro plan to continue using AI features.',
        })
      }
    }

    const result = await generateFilters({
      context: input.context,
      prompt: input.prompt,
      signal,
    })

    if (!context.subscription && result.filters.length > 0) {
      usage = await redisUsage.increment(context.user.id)
    }

    const remainingFreeAiUsage = context.subscription
      ? null
      : FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT - usage

    context.addLogData({
      filterResult: result,
      ...(remainingFreeAiUsage !== null && { remainingFreeAiUsage }),
    })

    return {
      ...result,
      ...(remainingFreeAiUsage !== null && {
        freeAiUsage: {
          max: FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT,
          remaining: remainingFreeAiUsage,
          resetAt: addDays(endOfMonth(new Date()), 1),
        },
      }),
    }
  })

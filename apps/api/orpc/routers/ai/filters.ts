import { fastAdapter } from '@tamery/ai/adapters'
import { filtersSystemPrompt } from '@tamery/ai/prompts/filters'
import { FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT } from '@tamery/shared/constants'
import { SQL_FILTERS_LIST } from '@tamery/shared/filters'
import { abortControllerFrom } from '@tamery/shared/utils/helpers'
import { chat } from '@tanstack/ai'
import { type } from 'arktype'
import { addDays, differenceInSeconds, endOfMonth, format } from 'date-fns'

import { redis } from '~/lib/redis'
import { optionalSubscriptionMiddleware, orpc } from '~/orpc'

const filtersOutputSchema = type({
  filters: type({
    column: 'string',
    operator: type.enumerated(
      ...SQL_FILTERS_LIST.map((filter) => filter.operator)
    ),
    values: 'string[]',
  }).array(),
  orderBy: type({
    column: 'string',
    direction: "'ASC' | 'DESC'",
  }).array(),
})

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
      message: 'string',
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

    const result = await chat({
      abortController: abortControllerFrom(signal),
      adapter: fastAdapter,
      messages: [{ content: input.prompt, role: 'user' }],
      outputSchema: filtersOutputSchema,
      systemPrompts: [filtersSystemPrompt(input.context)],
    })

    const orderBy = Object.fromEntries(
      (result?.orderBy ?? []).map(({ column, direction }) => [
        column,
        direction,
      ])
    )

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
      filters: result?.filters ?? [],
      orderBy,
      ...(remainingFreeAiUsage !== null && {
        freeAiUsage: {
          max: FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT,
          remaining: remainingFreeAiUsage,
          resetAt: addDays(endOfMonth(new Date()), 1),
        },
      }),
    }
  })

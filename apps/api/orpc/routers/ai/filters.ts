import { google } from '@ai-sdk/google'
import { FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT } from '@conar/shared/constants'
import { SQL_FILTERS_GROUPED, SQL_FILTERS_LIST } from '@conar/shared/filters'
import { generateText, Output } from 'ai'
import { type } from 'arktype'
import { addDays, differenceInSeconds, endOfMonth, format } from 'date-fns'
import * as z from 'zod/mini'
import { withPosthog } from '~/lib/posthog'
import { redis } from '~/lib/redis'
import { optionalSubscriptionMiddleware, orpc } from '~/orpc'

// Arktype doesn't work here, so we use Zod
const schema = z.object({
  orderBy: z.array(z.object({
    column: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  })),
  filters: z.array(z.object({
    column: z.string(),
    operator: z.enum(SQL_FILTERS_LIST.map(filter => filter.operator)),
    values: z.array(z.string()),
  })),
})

const redisUsage = {
  get: async (userId: string) => {
    const value = await redis.get(`ai:usage:${userId}:filters:${format(new Date(), 'yyyy-MM')}`)
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
  .input(type({
    prompt: 'string',
    context: 'string',
  }))
  .errors({
    FORBIDDEN: {
      message: 'string',
      data: type({
        remaining: 'number',
        max: 'number',
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
          message: 'You have reached the free AI usage limit. Please subscribe to a Pro plan to continue using AI features.',
          data: {
            remaining: 0,
            max: FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT,
            resetAt: addDays(endOfMonth(new Date()), 1),
          },
        })
      }
    }

    const { output: result } = await generateText({
      model: withPosthog(google('gemini-2.5-flash'), {
        prompt: input.prompt,
        context: input.context,
        userId: context.user.id,
      }),
      system: [
        'You are a filters and ordering generator that converts natural language queries into database filters and ordering instructions.',
        'You should understand the sense of the prompt as much as possible.',
        'Each of your filters or ordering responses will replace the previous ones.',
        '',
        'Guidelines:',
        '- Create multiple filters when the query has multiple conditions',
        '- Use exact column names as provided in the context',
        '- Choose the most appropriate operator for each condition',
        '- Format values correctly based on column types (strings, numbers, dates, etc.)',
        '- For enum columns, ensure values match the available options',
        '- For exact days use >= and <= operators',
        '- If user asks \'empty\' and the column is a string, use empty string as item in values array',
        '- If context already contains a filter, you can use it as reference to generate a new filter',
        '- User can paste only the value, you should try to understand to which column the value belongs',
        '- Try to generate at least one filter unless the prompt is completely unclear',
        '',
        'Ordering:',
        '- If the user requests sorting or ordering (e.g., "sort by date descending", "order by name ascending"), generate an orderBy array.',
        '- Use the exact column names from the context for ordering.',
        '- Each orderBy entry should have "column" (the column name) and "direction" ("ASC" or "DESC").',
        '- If no ordering is specified in the prompt, return an empty orderBy array.',
        '',
        `Current time: ${new Date().toISOString()}`,
        `Available operators: ${JSON.stringify(SQL_FILTERS_GROUPED, null, 2)}`,
        '',
        'Table context:',
        input.context,
      ].join('\n'),
      prompt: input.prompt,
      abortSignal: signal,
      output: Output.object({
        schema,
        description: 'An object with filters array and orderBy array; each filter has column, operator, and values; each orderBy entry has column and direction.',
      }),
    })

    // Convert orderBy array back to a record for the rest of the app
    const orderBy = Object.fromEntries(
      (result?.orderBy ?? []).map(({ column, direction }) => [column, direction]),
    )

    if (!context.subscription) {
      usage = await redisUsage.increment(context.user.id)
    }

    const remainingFreeAiUsage = context.subscription ? null : FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT - usage

    context.addLogData({
      filterResult: result,
      ...(remainingFreeAiUsage !== null && { remainingFreeAiUsage }),
    })

    return {
      orderBy,
      filters: result?.filters ?? [],
      ...(remainingFreeAiUsage !== null && {
        freeAiUsage: {
          remaining: remainingFreeAiUsage,
          max: FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT,
          resetAt: addDays(endOfMonth(new Date()), 1),
        },
      }),
    }
  })

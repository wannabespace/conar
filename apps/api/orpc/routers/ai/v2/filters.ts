import { generateFilters } from '@tamery/ai/features'
import { AiFeature } from '@tamery/ai/usage'
import { FREE_LIMITS } from '@tamery/shared/usage'
import { type } from 'arktype'

import { aiUsage } from '~/lib/ai-usage'
import { getUsage, recordUsage } from '~/lib/usage'
import { orpc, permissionsMiddleware, permix } from '~/orpc'

export const filters = orpc
  .use(permissionsMiddleware)
  .use(permix.checkMiddleware('ai.filter.use'))
  .input(
    type({
      context: 'string',
      prompt: 'string',
    })
  )
  .errors({
    FORBIDDEN: {
      message:
        'You have reached the free AI usage limit. Please subscribe to a Pro plan to continue using AI features.',
    },
  })
  .handler(async ({ input, signal, context, errors }) => {
    context.addLogData({
      filterInput: input.prompt,
    })

    const unlimited = context.permissions.check('ai.filter.unlimited')

    if (
      !unlimited &&
      (await getUsage(context.user.id, 'filters')) >= FREE_LIMITS.filters.max
    ) {
      throw errors.FORBIDDEN()
    }

    const result = await generateFilters({
      context: input.context,
      prompt: input.prompt,
      signal,
      telemetry: aiUsage.telemetry({
        feature: AiFeature.Filters,
        userId: context.user.id,
      }),
    })

    if (
      !unlimited &&
      (result.filters.length > 0 || Object.keys(result.orderBy).length > 0)
    ) {
      await recordUsage(context.user.id, 'filters')
    }

    context.addLogData({ filterResult: result })

    return result
  })

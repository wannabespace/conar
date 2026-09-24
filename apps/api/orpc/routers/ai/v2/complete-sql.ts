import { completeSql } from '@tamery/ai/features'
import { AiFeature } from '@tamery/ai/usage'
import { AI_SQL_LIMITS } from '@tamery/shared/constants'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { aiUsage } from '~/lib/ai-usage'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const completeSQL = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      context: type.string.atMostLength(AI_SQL_LIMITS.context),
      prefix: type.string.atMostLength(AI_SQL_LIMITS.sql),
      suffix: type.string.atMostLength(AI_SQL_LIMITS.sql),
      type: type.valueOf(ConnectionType),
    })
  )
  .handler(({ context, input, signal }) => {
    const scope = { feature: AiFeature.CompleteSql, userId: context.user.id }
    return completeSql({
      connectionType: input.type,
      context: input.context,
      onUsage: (modelId, usage) => aiUsage.record(scope, modelId, usage),
      prefix: input.prefix,
      signal,
      suffix: input.suffix,
      telemetry: aiUsage.telemetry(scope),
    })
  })

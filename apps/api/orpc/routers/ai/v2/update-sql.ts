import { updateSql } from '@tamery/ai/features'
import { AiFeature } from '@tamery/ai/usage'
import { AI_SQL_LIMITS } from '@tamery/shared/constants'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { aiUsage } from '~/lib/ai-usage'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const updateSQL = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      context: type.string.atMostLength(AI_SQL_LIMITS.context),
      prompt: type.string.atMostLength(AI_SQL_LIMITS.prompt),
      sql: type.string.atMostLength(AI_SQL_LIMITS.sql),
      type: type.valueOf(ConnectionType),
    })
  )
  .handler(({ context, input, signal }) =>
    updateSql({
      connectionType: input.type,
      context: input.context,
      prompt: input.prompt,
      signal,
      sql: input.sql,
      telemetry: aiUsage.telemetry({
        feature: AiFeature.UpdateSql,
        userId: context.user.id,
      }),
    })
  )

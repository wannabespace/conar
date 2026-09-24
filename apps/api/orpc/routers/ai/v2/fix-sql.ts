import { fixSql } from '@tamery/ai/features'
import { AiFeature } from '@tamery/ai/usage'
import { AI_SQL_LIMITS } from '@tamery/shared/constants'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { aiUsage } from '~/lib/ai-usage'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const fixSQL = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      context: type.string.atMostLength(AI_SQL_LIMITS.context),
      editor: type.string.atMostLength(AI_SQL_LIMITS.sql),
      error: type.string.atMostLength(AI_SQL_LIMITS.error),
      sql: type.string.atMostLength(AI_SQL_LIMITS.sql),
      type: type.valueOf(ConnectionType),
    })
  )
  .handler(({ context, input, signal }) =>
    fixSql({
      connectionType: input.type,
      context: input.context,
      editor: input.editor,
      error: input.error,
      signal,
      sql: input.sql,
      telemetry: aiUsage.telemetry({
        feature: AiFeature.FixSql,
        userId: context.user.id,
      }),
    })
  )

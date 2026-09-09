import { fixSql } from '@tamery/ai/features'
import { AiFeature } from '@tamery/ai/usage'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { aiUsage } from '~/lib/ai-usage'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const fixSQL = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      error: 'string',
      sql: 'string',
      type: type.valueOf(ConnectionType),
    })
  )
  .handler(({ context, input, signal }) =>
    fixSql({
      connectionType: input.type,
      error: input.error,
      signal,
      sql: input.sql,
      telemetry: aiUsage.telemetry({
        feature: AiFeature.FixSql,
        userId: context.user.id,
      }),
    })
  )

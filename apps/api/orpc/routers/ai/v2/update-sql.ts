import { updateSql } from '@tamery/ai/features'
import { AI_SQL_LIMITS } from '@tamery/ai/limits'
import { AiFeature } from '@tamery/ai/usage'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { aiUsage } from '~/lib/ai-usage'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const updateSQL = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      context: `string <= ${AI_SQL_LIMITS.context}`,
      editor: `string <= ${AI_SQL_LIMITS.sql}`,
      prompt: `string <= ${AI_SQL_LIMITS.prompt}`,
      sql: `string <= ${AI_SQL_LIMITS.sql}`,
      type: type.valueOf(ConnectionType),
    })
  )
  .handler(({ context, input, signal }) =>
    updateSql({
      connectionType: input.type,
      context: input.context,
      editor: input.editor,
      prompt: input.prompt,
      signal,
      sql: input.sql,
      telemetry: aiUsage.telemetry({
        feature: AiFeature.UpdateSql,
        userId: context.user.id,
      }),
    })
  )

import { fixSql } from '@tamery/ai/features'
import { AI_SQL_LIMITS } from '@tamery/ai/limits'
import { AiFeature } from '@tamery/ai/usage'
import { SqlDialect } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { aiUsage } from '~/lib/ai-usage'
import { orpc, permissionsMiddleware, permix } from '~/orpc'

export const fixSQL = orpc
  .use(permissionsMiddleware)
  .use(permix.checkMiddleware('ai.sql.use'))
  .input(
    type({
      context: `string <= ${AI_SQL_LIMITS.context}`,
      editor: `string <= ${AI_SQL_LIMITS.sql}`,
      error: `string <= ${AI_SQL_LIMITS.error}`,
      sql: `string <= ${AI_SQL_LIMITS.sql}`,
      type: type.valueOf(SqlDialect),
    })
  )
  .handler(({ context, input, signal }) =>
    fixSql({
      context: input.context,
      dialect: input.type,
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

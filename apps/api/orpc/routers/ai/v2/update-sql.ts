import { updateSql } from '@tamery/ai/update-sql'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { orpc, subscriptionMiddleware } from '~/orpc'

export const updateSQL = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      context: 'string',
      prompt: 'string',
      sql: 'string',
      type: type.valueOf(ConnectionType),
    })
  )
  .handler(({ input, signal }) =>
    updateSql({
      connectionType: input.type,
      context: input.context,
      prompt: input.prompt,
      signal,
      sql: input.sql,
    })
  )

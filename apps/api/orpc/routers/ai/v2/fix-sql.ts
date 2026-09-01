import { fixSql } from '@tamery/ai/fix-sql'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

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
  .handler(({ input, signal }) =>
    fixSql({
      connectionType: input.type,
      error: input.error,
      signal,
      sql: input.sql,
    })
  )

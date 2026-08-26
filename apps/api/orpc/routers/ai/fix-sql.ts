import { sqlAdapter } from '@tamery/ai/adapters'
import { fixSqlPrompt, fixSqlSystemPrompt } from '@tamery/ai/prompts/fix-sql'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { abortControllerFrom } from '@tamery/shared/utils/helpers'
import { chat } from '@tanstack/ai'
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
    chat({
      abortController: abortControllerFrom(signal),
      adapter: sqlAdapter,
      messages: [{ content: fixSqlPrompt(input), role: 'user' }],
      stream: false,
      systemPrompts: [fixSqlSystemPrompt(input.type)],
    })
  )

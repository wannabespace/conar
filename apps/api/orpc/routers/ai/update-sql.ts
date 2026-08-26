import { chatAdapter } from '@tamery/ai/adapters'
import {
  updateSqlPrompts,
  updateSqlSystemPrompt,
} from '@tamery/ai/prompts/update-sql'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { abortControllerFrom } from '@tamery/shared/utils/helpers'
import { chat } from '@tanstack/ai'
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
    chat({
      abortController: abortControllerFrom(signal),
      adapter: chatAdapter,
      messages: updateSqlPrompts(input).map((content) => ({
        content,
        role: 'user' as const,
      })),
      stream: false,
      systemPrompts: [
        updateSqlSystemPrompt({
          connectionType: input.type,
          context: input.context,
        }),
      ],
    })
  )

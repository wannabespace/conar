import { type } from 'arktype'

import { abortStreamsFor } from '~/lib/chat-streams/registry'
import { authMiddleware, orpc } from '~/orpc'

export const abortStream = orpc
  .use(authMiddleware)
  .input(type({ chatId: 'string.uuid.v7' }))
  .handler(({ context, input }) => {
    abortStreamsFor({ chatId: input.chatId, userId: context.user.id })
  })

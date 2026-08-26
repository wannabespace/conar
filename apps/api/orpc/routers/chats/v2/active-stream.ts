import { type } from 'arktype'

import { activeStreamFor } from '~/lib/chat-streams/registry'
import { authMiddleware, orpc } from '~/orpc'

// Which stream is writing this chat right now, for a client that cannot know:
// the resume pointer is per-device, so a second device opening a chat mid-answer
// has to ask.
export const activeStream = orpc
  .use(authMiddleware)
  .input(type({ chatId: 'string.uuid.v7' }))
  .handler(({ context, input }) => ({
    streamId: activeStreamFor({
      chatId: input.chatId,
      userId: context.user.id,
    }),
  }))

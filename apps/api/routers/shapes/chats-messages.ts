import { chats, chatsMessages } from '@conar/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { createShape, qb } from '~/lib/electric'

export const chatsMessagesShape = createShape(async (c) => {
  const userChats = qb
    .select({ id: chats.id })
    .from(chats)
    .where(eq(chats.userId, c.get('userId')))

  return {
    where: inArray(chatsMessages.chatId, userChats),
    table: 'chats_messages' satisfies typeof chatsMessages._.name,
  }
})

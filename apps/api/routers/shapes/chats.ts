import { chats } from '@conar/db/schema'
import { eq } from 'drizzle-orm'
import { createShape } from '~/lib/electric'

export const chatsShape = createShape(async (c) => {
  return {
    where: eq(chats.userId, c.get('userId')),
    table: 'chats' satisfies typeof chats._.name,
    columns: [
      chats.id,
      chats.connectionResourceId,
      chats.title,
      chats.createdAt,
      chats.updatedAt,
    ],
  }
})

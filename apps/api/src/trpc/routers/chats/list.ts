import { desc, eq } from 'drizzle-orm'
import { chats, chatsMessages, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const list = protectedProcedure
  .query(async ({ ctx }) => db
    .select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
      messages: chatsMessages.parts,
    })
    .from(chats)
    .leftJoin(chatsMessages, eq(chats.id, chatsMessages.chatId))
    .where(eq(chats.userId, ctx.user.id))
    .orderBy(desc(chats.createdAt)),
  )

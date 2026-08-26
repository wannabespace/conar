import { ORPCError } from '@orpc/server'
import { db } from '@tamery/db'
import { chats, chatsMessages, chatsMessagesParts } from '@tamery/db/schema'
import type { UIMessage } from '@tanstack/ai'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import { publisher as chatsMessagesPartsPublisher } from '~/orpc/routers/chats-messages-parts/events'
import { publisher as chatsMessagesPublisher } from '~/orpc/routers/chats-messages/events'
import { publisher as chatsPublisher } from '~/orpc/routers/chats/events'

const uuidV7 = type('string.uuid.v7')

export const ensureChat = async (data: {
  chatId: string
  connectionResourceId: string
  userId: string
}) => {
  const [existing] = await db
    .select({ id: chats.id, userId: chats.userId })
    .from(chats)
    .where(eq(chats.id, data.chatId))
    .limit(1)

  if (existing) {
    if (existing.userId !== data.userId) {
      throw new ORPCError('NOT_FOUND', { message: 'Chat not found' })
    }
    return
  }

  const resource = await db.query.connectionsResources.findFirst({
    columns: { id: true },
    where: {
      connection: { userId: { eq: data.userId } },
      id: { eq: data.connectionResourceId },
    },
  })
  if (!resource) {
    throw new ORPCError('NOT_FOUND', {
      message: 'Connection resource not found',
    })
  }

  const [inserted] = await db
    .insert(chats)
    .values({
      connectionResourceId: data.connectionResourceId,
      id: data.chatId,
      userId: data.userId,
    })
    .onConflictDoNothing()
    .returning()

  if (inserted) {
    chatsPublisher.publish(data.userId, { type: 'insert', value: inserted })
  }
}

export const persistMessage = async (data: {
  chatId: string
  message: UIMessage
  userId: string
}) => {
  if (data.message.parts.length === 0) {
    return
  }

  const id = uuidV7.allows(data.message.id) ? data.message.id : uuidv7()
  const { inserted, parts } = await db.transaction(async (tx) => {
    const [insertedMessage] = await tx
      .insert(chatsMessages)
      .values({
        chatId: data.chatId,
        id,
        metadata: data.message.metadata ?? null,
        role: data.message.role,
      })
      .onConflictDoNothing()
      .returning()

    if (!insertedMessage) {
      return { inserted: null, parts: [] }
    }

    const insertedParts = await tx
      .insert(chatsMessagesParts)
      .values(
        data.message.parts.map((part, order) => ({
          messageId: insertedMessage.id,
          order,
          part,
        }))
      )
      .returning()

    return { inserted: insertedMessage, parts: insertedParts }
  })

  if (!inserted) {
    return
  }

  chatsMessagesPublisher.publish(data.userId, {
    type: 'insert',
    value: inserted,
  })
  for (const part of parts) {
    chatsMessagesPartsPublisher.publish(data.userId, {
      type: 'insert',
      value: part,
    })
  }
}

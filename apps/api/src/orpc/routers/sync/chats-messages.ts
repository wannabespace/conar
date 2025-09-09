import { eventIterator, EventPublisher } from '@orpc/server'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, getTableColumns, gt, inArray, notInArray, or } from 'drizzle-orm'
import { chats, chatsMessages, chatsMessagesSelectSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const publisher = new EventPublisher<{
  action: {
    userId: string
  } & ({
    type: 'insert'
    value: typeof chatsMessagesSelectSchema.infer
  } | {
    type: 'update'
    value: typeof chatsMessagesSelectSchema.infer
  } | {
    type: 'delete'
    value: string
  })
}>()

const entityUpdatesSchema = type.or(
  type({
    type: '"insert"',
    value: chatsMessagesSelectSchema,
  }),
  type({
    type: '"update"',
    value: chatsMessagesSelectSchema,
  }),
  type({
    type: '"delete"',
    value: 'string.uuid.v7',
  }),
)

export const sync = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
    updatedAt: 'Date',
  }).array())
  .output(eventIterator(type.or(
    type({
      type: '"sync"',
      value: entityUpdatesSchema.array(),
    }),
    type({
      type: '"insert"',
      value: chatsMessagesSelectSchema,
    }),
    type({
      type: '"delete"',
      value: 'string.uuid.v7',
    }),
    type({
      type: '"update"',
      value: chatsMessagesSelectSchema,
    }),
  )))
  .handler(async function* ({ input, context, signal }) {
    const inputIds = input.map(i => i.id)
    const [updatedItems, newItems, allIds] = await Promise.all([
      inputIds.length > 0
        ? db
            .select(getTableColumns(chatsMessages))
            .from(chatsMessages)
            .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
            .where(
              and(
                eq(chats.userId, context.user.id),
                or(...input.map(message =>
                  and(eq(chatsMessages.id, message.id), gt(chatsMessages.updatedAt, addSeconds(message.updatedAt, 1))),
                )),
              ),
            )
        : [],
      db
        .select(getTableColumns(chatsMessages))
        .from(chatsMessages)
        .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
        .where(and(
          eq(chats.userId, context.user.id),
          notInArray(chatsMessages.id, inputIds),
        )),
      db
        .select({ id: chatsMessages.id })
        .from(chatsMessages)
        .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
        .where(and(
          eq(chats.userId, context.user.id),
          inArray(chatsMessages.id, inputIds),
        ))
        .then(r => r.map(item => item.id)),
    ])
    const missingIds = inputIds.filter(id => !allIds.includes(id))

    const sync: typeof entityUpdatesSchema.infer[] = []

    updatedItems.forEach((item) => {
      sync.push({
        type: 'update',
        value: item,
      })
    })

    newItems.forEach((item) => {
      sync.push({
        type: 'insert',
        value: item,
      })
    })

    missingIds.forEach((item) => {
      sync.push({
        type: 'delete',
        value: item,
      })
    })

    yield {
      type: 'sync' as const,
      value: sync,
    }

    for await (const payload of publisher.subscribe('action', { signal })) {
      if (payload.userId !== context.user.id) {
        continue
      }

      switch (payload.type) {
        case 'update':
          yield {
            type: 'update',
            value: payload.value,
          }
          break
        case 'insert':
          yield {
            type: 'insert',
            value: payload.value,
          }
          break
        case 'delete':
          yield {
            type: 'delete',
            value: payload.value,
          }
          break
      }
    }
  })

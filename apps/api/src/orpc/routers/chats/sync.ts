import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gt, inArray, notInArray, or } from 'drizzle-orm'
import { chats, chatsSelectSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

const output = type.or(
  type({
    type: '"insert"',
    value: chatsSelectSchema,
  }),
  type({
    type: '"update"',
    value: chatsSelectSchema,
  }),
  type({
    type: '"delete"',
    value: 'string.uuid.v7',
  }),
).array()

export const sync = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
    updatedAt: 'Date',
  }).array())
  .output(output)
  .handler(async function ({ input, context }) {
    const inputIds = input.map(i => i.id)
    const [updatedItems, newItems, existingIds] = await Promise.all([
      inputIds.length > 0
        ? db.select().from(chats).where(
            and(
              eq(chats.userId, context.user.id),
              or(...input.map(chat =>
                and(eq(chats.id, chat.id), gt(chats.updatedAt, addSeconds(chat.updatedAt, 1))),
              )),
            ),
          )
        : [],
      db
        .select()
        .from(chats)
        .where(and(
          eq(chats.userId, context.user.id),
          notInArray(chats.id, inputIds),
        )),
      db
        .select({ id: chats.id })
        .from(chats)
        .where(and(
          eq(chats.userId, context.user.id),
          inArray(chats.id, inputIds),
        ))
        .then(r => r.map(item => item.id)),
    ])
    const missingIds = inputIds.filter(id => !existingIds.includes(id))

    const sync: typeof output.infer = []

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

    return sync
  })

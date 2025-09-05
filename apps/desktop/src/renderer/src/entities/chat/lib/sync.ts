import { isDeeplyEqual } from '@conar/shared/utils/helpers'
import { queryOptions } from '@tanstack/react-query'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'
import { chats, chatsMessages, db } from '~/drizzle'
import { orpc } from '~/lib/orpc'

async function syncChats() {
  let fetchedMessages: typeof chatsMessages.$inferSelect[] = []
  let existingMessages: typeof chatsMessages.$inferSelect[] = []

  try {
    const [fetchedChats, existingChats] = await Promise.all([
      orpc.chats.list(),
      db.query.chats.findMany({ with: { messages: true } }),
    ])

    fetchedMessages = fetchedChats.flatMap(c => c.messages)
    existingMessages = existingChats.flatMap(c => c.messages)

    const fetchedMap = new Map(fetchedChats.map(c => [c.id, c]))
    const existingMap = new Map(existingChats.map(c => [c.id, c]))

    const toDelete = existingChats.filter(c => !fetchedMap.has(c.id)).map(c => c.id)
    const toAdd = fetchedChats.filter(c => !existingMap.has(c.id))
    const toUpdate = fetchedChats
      .filter(c => existingMap.has(c.id))
      .map((c) => {
        const existing = existingMap.get(c.id)!
        const changes: Partial<typeof chats.$inferSelect> = {}

        if (existing.title !== c.title) {
          changes.title = c.title
        }

        return {
          id: c.id,
          changes,
        }
      })
      .filter(c => Object.keys(c.changes).length > 0)

    await db.transaction(async (tx) => {
      await Promise.all([
        ...toDelete.map(id => tx.delete(chats).where(eq(chats.id, id))),
        ...toAdd.map(c => tx.insert(chats).values(c)),
        ...toUpdate.map(c => tx.update(chats).set(c.changes).where(eq(chats.id, c.id))),
      ])
    })
  }
  catch (e) {
    console.error(e)
    toast.error('Failed to fetch chats. Please try again later.')
  }

  const existingMap = new Map(existingMessages.map(m => [m.id, m]))
  const fetchedMap = new Map(fetchedMessages.map(m => [m.id, m]))

  const toDelete = existingMessages.filter(m => !fetchedMap.has(m.id)).map(m => m.id)
  const toAdd = fetchedMessages.filter(m => !existingMap.has(m.id))
  const toUpdate = fetchedMessages
    .filter(m => existingMap.has(m.id))
    .map((m) => {
      const existing = existingMap.get(m.id)!
      const changes: Partial<typeof m> = {}

      if (!isDeeplyEqual(existing.parts, m.parts)) {
        changes.parts = m.parts
      }
      if (existing.role !== m.role) {
        changes.role = m.role
      }
      if (existing.chatId !== m.chatId) {
        changes.chatId = m.chatId
      }
      if (existing.metadata && m.metadata && !isDeeplyEqual(existing.metadata, m.metadata)) {
        changes.metadata = m.metadata
      }

      return {
        id: m.id,
        changes,
      }
    })
    .filter(m => Object.keys(m.changes).length > 0)

  try {
    await db.transaction(async (tx) => {
      await Promise.all([
        ...toDelete.map(id => tx.delete(chatsMessages).where(eq(chatsMessages.id, id))),
        ...toAdd.map(m => tx.insert(chatsMessages).values(m)),
        ...toUpdate.map(m => tx.update(chatsMessages).set(m.changes).where(eq(chatsMessages.id, m.id))),
      ])
    })
  }
  catch (e) {
    console.error(e)
    toast.error('Failed to fetch messages. Please try again later.')
  }
}

export const syncChatsQueryOptions = queryOptions({
  queryKey: ['sync-chats'],
  queryFn: async () => {
    await syncChats()
    return true
  },
  enabled: false,
})

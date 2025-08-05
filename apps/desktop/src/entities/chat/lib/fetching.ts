import { drizzleFn, ensureDrizzleQuery, useDrizzleLive } from '~/hooks/use-drizzle-live'

function chatsFn(databaseId: string) {
  return drizzleFn(query => query.chats.findMany({
    where: (tables, { eq }) => eq(tables.databaseId, databaseId),
    orderBy: (chatsMessages, { desc }) => [desc(chatsMessages.createdAt)],
    with: {
      messages: true,
    },
  }))
}

export function ensureChats(databaseId: string) {
  return ensureDrizzleQuery(chatsFn(databaseId))
}

export function useChatsLive(databaseId: string) {
  return useDrizzleLive({
    fn: chatsFn(databaseId),
  })
}

import { sessionStorageValue, useSessionStorage } from '@conar/ui/hookas/use-session-storage'

function getLastChatIdKey(databaseId: string) {
  return `sql-last-chat-id-${databaseId}`
}

export function useLastOpenedChatId(databaseId: string) {
  return useSessionStorage<string | null>(getLastChatIdKey(databaseId), null)
}

export function lastOpenedChatId(databaseId: string) {
  return sessionStorageValue<string | null>(getLastChatIdKey(databaseId), null)
}

import { getSessionStorageValue, useSessionStorage } from '@conar/ui/hookas/use-session-storage'

interface LastOpenedTable {
  schema: string
  table: string
}

export function getLastOpenedTable(id: string) {
  return getSessionStorageValue<LastOpenedTable | null>(`last-opened-table-${id}`, null)
}

export function useLastOpenedTable(id: string) {
  return useSessionStorage<LastOpenedTable | null>(`last-opened-table-${id}`, null)
}

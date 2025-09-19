import { localStorageValue, useLocalStorage } from '@conar/ui/hookas/use-local-storage'

interface LastOpenedTable {
  schema: string
  table: string
}

function getLastOpenedTableKey(databaseId: string) {
  return `last-opened-table-${databaseId}`
}

export function useLastOpenedTable(id: string) {
  return useLocalStorage<LastOpenedTable | null>(getLastOpenedTableKey(id), null)
}

export function lastOpenedTable(id: string) {
  return localStorageValue<LastOpenedTable | null>(getLastOpenedTableKey(id), null)
}

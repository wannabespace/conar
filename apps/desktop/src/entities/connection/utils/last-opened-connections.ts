import { localStorageValue, useLocalStorage } from '@conar/ui/hookas/use-local-storage'

const LAST_OPENED_CONNECTIONS_KEY = 'last-opened-connections'

export const lastOpenedConnections = localStorageValue<string[]>(LAST_OPENED_CONNECTIONS_KEY, [])

export function useLastOpenedConnections() {
  return useLocalStorage<string[]>(LAST_OPENED_CONNECTIONS_KEY, [])
}

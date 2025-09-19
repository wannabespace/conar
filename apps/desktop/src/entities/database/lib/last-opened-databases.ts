import { sessionStorageValue, useSessionStorage } from '@conar/ui/hookas/use-session-storage'

const LAST_OPENED_DATABASES_KEY = 'last-opened-databases'

export function useLastOpenedDatabases() {
  return useSessionStorage<string[]>(LAST_OPENED_DATABASES_KEY, [])
}

export const lastOpenedDatabases = sessionStorageValue<string[]>(LAST_OPENED_DATABASES_KEY, [])

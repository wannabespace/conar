import { localStorageValue, useLocalStorage } from '@conar/ui/hookas/use-local-storage'

const LAST_OPENED_RESOURCES_KEY = 'last-opened-resources'

export const lastOpenedResources = localStorageValue<string[]>(LAST_OPENED_RESOURCES_KEY, [])

export function useLastOpenedResources() {
  return useLocalStorage<string[]>(LAST_OPENED_RESOURCES_KEY, [])
}

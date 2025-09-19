import type { FileRoutesById } from '~/routeTree.gen'
import { localStorageValue, useLocalStorage } from '@conar/ui/hookas/use-local-storage'

type LastOpenedPage = Extract<keyof FileRoutesById, `/(protected)/_protected/database/$id/${string}`>

export function getDatabasePageId(routesIds: (keyof FileRoutesById)[]) {
  return routesIds.find(route => route.includes('/(protected)/_protected/database/$id/')) as LastOpenedPage | undefined
}

function getLastOpenedPageKey(databaseId: string) {
  return `last-opened-page-${databaseId}`
}

export function useLastOpenedPage(id: string) {
  return useLocalStorage<LastOpenedPage | null>(getLastOpenedPageKey(id), null)
}

export function lastOpenedPage(id: string) {
  return localStorageValue<LastOpenedPage | null>(getLastOpenedPageKey(id), null)
}

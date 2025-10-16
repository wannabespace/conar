import { localStorageValue, useLocalStorage } from '@conar/ui/hookas/use-local-storage'

export const loggerOpenedValue = localStorageValue('logger-opened', false)

export function useLoggerOpened() {
  return useLocalStorage('logger-opened', false)
}

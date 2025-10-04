import { useLocalStorage } from '@conar/ui/hookas/use-local-storage'

export function useLoggerOpened() {
  return useLocalStorage('logger-opened', false)
}

import { useEffect } from 'react'
import { globalHooks } from '~/global-hooks'

export function useRefreshHotkey(refresh: () => unknown, disabled = false) {
  useEffect(() => {
    return globalHooks.hook('refreshPressed', () => {
      if (!disabled) {
        refresh()
      }
    })
  }, [disabled, refresh])
}

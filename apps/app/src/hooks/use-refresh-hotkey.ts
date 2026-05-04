import { useEffect, useEffectEvent } from 'react'
import { globalHooks } from '~/global-hooks'

export function useRefreshHotkey(refresh: () => unknown, disabled = false) {
  const refreshEvent = useEffectEvent(refresh)

  useEffect(() => {
    return globalHooks.hook('refreshPressed', () => {
      if (!disabled) {
        refreshEvent()
      }
    })
  }, [disabled])
}

import { useEffect, useEffectEvent } from 'react'
import { globalHooks } from '~/global-hooks'

export function useSaveHotkey(save: () => unknown, disabled = false) {
  const saveEvent = useEffectEvent(save)

  useEffect(() => {
    return globalHooks.hook('savePressed', () => {
      if (!disabled) {
        saveEvent()
      }
    })
  }, [disabled])
}

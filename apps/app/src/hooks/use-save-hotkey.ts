import { useEffect, useEffectEvent } from 'react'

import { globalHooks } from '~/global-hooks'

export const useSaveHotkey = (save: () => unknown, disabled = false) => {
  const saveEvent = useEffectEvent(save)

  useEffect(
    () =>
      globalHooks.hook('savePressed', () => {
        if (!disabled) {
          saveEvent()
        }
      }),
    [disabled]
  )
}

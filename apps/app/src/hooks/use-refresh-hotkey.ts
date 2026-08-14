import { useEffect, useEffectEvent } from 'react'

import { globalHooks } from '~/global-hooks'

export const useRefreshHotkey = (refresh: () => unknown, disabled = false) => {
  const refreshEvent = useEffectEvent(refresh)

  useEffect(
    () =>
      globalHooks.hook('refreshPressed', () => {
        if (!disabled) {
          refreshEvent()
        }
      }),
    [disabled]
  )
}

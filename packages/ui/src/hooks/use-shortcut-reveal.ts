import { getKeyStateTracker, useKeyHold } from '@tanstack/react-hotkeys'
import { type } from 'arktype'
import { useEffect, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import { isMac } from '../lib/os'

const REVEAL_DELAY_MS = 800

export const shortcutRevealStore = createWebStorageValue({
  defaultValue: true,
  key: 'shortcut-reveal',
  schema: type('boolean'),
  type: 'localStorage',
})

export const useShortcutReveal = (trigger: HTMLElement | null) => {
  const isEnabled = useSubscription(shortcutRevealStore)
  const isHeld = useKeyHold(isMac ? 'Meta' : 'Control')
  const [heldLongEnough, setHeldLongEnough] = useState(false)

  useEffect(() => {
    if (!isHeld || !trigger) {
      return
    }
    // The trigger is hit-tested only once, so a shortcut pressed mid-hold must end the reveal: what it opens would sit under the hints.
    const timeout = setTimeout(() => {
      const { left, top, width, height } = trigger.getBoundingClientRect()
      setHeldLongEnough(
        trigger.contains(
          document.elementFromPoint(left + width / 2, top + height / 2)
        )
      )
    }, REVEAL_DELAY_MS)
    const combo = getKeyStateTracker().store.subscribe(({ heldKeys }) => {
      if (heldKeys.length > 1) {
        clearTimeout(timeout)
        setHeldLongEnough(false)
      }
    })
    return () => {
      clearTimeout(timeout)
      combo.unsubscribe()
      setHeldLongEnough(false)
    }
  }, [isHeld, trigger])

  return isEnabled && isHeld && heldLongEnough
}

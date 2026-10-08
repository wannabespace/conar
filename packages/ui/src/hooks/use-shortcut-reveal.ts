import { getKeyStateTracker, useKeyHold } from '@tanstack/react-hotkeys'
import { type } from 'arktype'
import { useEffect, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

const REVEAL_DELAY_MS = 800

export const shortcutRevealStore = createWebStorageValue({
  defaultValue: true,
  key: 'shortcut-reveal',
  schema: type('boolean'),
  type: 'localStorage',
})

export const useShortcutReveal = () => {
  const isEnabled = useSubscription(shortcutRevealStore)
  const isHeld = useKeyHold(
    navigator.userAgent.includes('Mac') ? 'Meta' : 'Control'
  )
  const [heldLongEnough, setHeldLongEnough] = useState(false)

  useEffect(() => {
    if (!isHeld) {
      return
    }
    const timeout = setTimeout(() => setHeldLongEnough(true), REVEAL_DELAY_MS)
    // Hints hit-test their trigger only when they render, so a shortcut pressed mid-hold ends the reveal: the dialog or menu it opens would sit under hints nothing re-checks.
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
  }, [isHeld])

  return isEnabled && isHeld && heldLongEnough
}

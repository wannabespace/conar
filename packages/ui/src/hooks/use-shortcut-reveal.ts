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

export const useShortcutReveal = (trigger: HTMLElement | null) => {
  const isEnabled = useSubscription(shortcutRevealStore)
  const isHeld = useKeyHold(
    navigator.userAgent.includes('Mac') ? 'Meta' : 'Control'
  )
  const [heldLongEnough, setHeldLongEnough] = useState(false)

  useEffect(() => {
    if (!isHeld || !trigger) {
      return
    }
    // The trigger is hit-tested once, as the reveal starts, so a hint never paints over a menu or dialog covering it. A shortcut pressed mid-hold therefore ends the reveal: the dialog or menu it opens would sit under hints nothing re-checks.
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

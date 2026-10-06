import { useKeyHold } from '@tanstack/react-hotkeys'
import { useEffect, useState } from 'react'

const REVEAL_DELAY_MS = 400

/** True once the platform's command key has been held for a beat, so controls can show the shortcuts they answer to. */
export const useShortcutReveal = () => {
  const isHeld = useKeyHold(
    navigator.userAgent.includes('Mac') ? 'Meta' : 'Control'
  )
  const [heldLongEnough, setHeldLongEnough] = useState(false)

  useEffect(() => {
    if (!isHeld) {
      return
    }
    const timeout = setTimeout(() => setHeldLongEnough(true), REVEAL_DELAY_MS)
    return () => {
      clearTimeout(timeout)
      setHeldLongEnough(false)
    }
  }, [isHeld])

  return isHeld && heldLongEnough
}

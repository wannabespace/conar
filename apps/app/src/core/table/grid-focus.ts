import type { RefObject } from 'react'
import { useEffect } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'

const requestedKey = createStore<string | null>(null)

// Focus landing anywhere first means the user moved on; a grid mounting later must not snatch it back.
document.addEventListener('focusin', () => requestedKey.set(null))

export const requestGridFocus = (key: string) => requestedKey.set(key)

export const useGridFocusRequest = (
  key: string | undefined,
  scrollRef: RefObject<HTMLElement | null>
) => {
  const requested = useSubscription(requestedKey, {
    selector: (requestedFor) => requestedFor === key,
  })
  useEffect(() => {
    if (requested) {
      scrollRef.current?.focus({ preventScroll: true })
      requestedKey.set(null)
    }
  }, [requested, scrollRef])
}

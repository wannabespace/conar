import type { RefObject } from 'react'
import { useEffect } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'

const pendingFocus = createStore<{ key: string; from?: Element } | null>(null)

// `from` is exempt: a press-nav Link fires its click on mousedown, before the browser focuses it.
document.addEventListener('focusin', (event) => {
  if (event.target !== pendingFocus.get()?.from) {
    pendingFocus.set(null)
  }
})

export const focusGridWhenReady = (key: string, from?: Element) =>
  pendingFocus.set({ from, key })

export const usePendingGridFocus = (
  key: string | undefined,
  scrollRef: RefObject<HTMLElement | null>
) => {
  const requested = useSubscription(pendingFocus, {
    selector: (pending) => !!pending && pending.key === key,
  })
  useEffect(() => {
    if (requested) {
      scrollRef.current?.focus({ preventScroll: true })
      pendingFocus.set(null)
    }
  }, [requested, scrollRef])
}

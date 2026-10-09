import type { RefObject } from 'react'
import { useEffect } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'

const request = createStore<{ key: string; from?: Element } | null>(null)

// Focus landing anywhere first means the user moved on; a grid mounting later must not snatch it back.
// `from` is exempt: a press-nav Link fires its click on mousedown, before the browser focuses it.
document.addEventListener('focusin', (event) => {
  if (event.target !== request.get()?.from) {
    request.set(null)
  }
})

export const requestGridFocus = (key: string, from?: Element) =>
  request.set({ from, key })

export const useGridFocusRequest = (
  key: string | undefined,
  scrollRef: RefObject<HTMLElement | null>
) => {
  const requested = useSubscription(request, {
    selector: (pending) => pending?.key === key,
  })
  useEffect(() => {
    if (requested) {
      scrollRef.current?.focus({ preventScroll: true })
      request.set(null)
    }
  }, [requested, scrollRef])
}

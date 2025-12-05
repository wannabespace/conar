import * as React from 'react'

export type KeyboardEventFilter = string | ((event: KeyboardEvent) => boolean)

export function useKeyboardEvent(
  predicate: KeyboardEventFilter,
  callback: (event: KeyboardEvent) => void,
  options: {
    event?: 'keydown' | 'keypress' | 'keyup'
    target?: HTMLElement | React.RefObject<HTMLElement | null>
    deps?: React.DependencyList
  } = {},
): void {
  const { event = 'keydown', target = window } = options
  const callbackEvent = React.useEffectEvent(callback)
  const getPredicateEvent = React.useEffectEvent((ev: KeyboardEvent) => {
    return typeof predicate === 'string'
      ? ev.key === predicate
      : predicate(ev)
  })

  React.useEffect(() => {
    const abortController = new AbortController()

    const t = 'current' in target ? target.current : target

    if (!t) {
      return
    }

    t.addEventListener(event, (e) => {
      const event = e as KeyboardEvent
      const matches = getPredicateEvent(event)

      if (matches) {
        callbackEvent(event)
      }
    }, {
      signal: abortController.signal,
    })

    return () => {
      abortController.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, target, ...(options.deps || [])])
}

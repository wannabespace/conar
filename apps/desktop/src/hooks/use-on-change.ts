import { useEffect, useEffectEvent, useRef } from 'react'

export function useOnChange<T>(value: T, effect: (next: T, prev: T) => void) {
  const previousRef = useRef(value)
  const onChange = useEffectEvent(effect)

  useEffect(() => {
    if (previousRef.current === value)
      return

    const prev = previousRef.current
    previousRef.current = value
    onChange(value, prev)
  }, [value])
}

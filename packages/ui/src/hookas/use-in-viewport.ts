import * as React from 'react'

export function useInViewport(ref: React.RefObject<HTMLElement | null>, visibility: 'full' | 'partial' | number = 'partial') {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useLayoutEffect(() => {
    if (!ref.current)
      return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold: typeof visibility === 'number' ? visibility : visibility === 'full' ? 1 : 0,
      },
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, visibility])

  return isVisible
}

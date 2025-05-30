import * as React from 'react'

export function useInViewport(ref: React.RefObject<HTMLElement | null>, {
  threshold = 0,
  root = null,
  rootMargin = '0px',
}: {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
} = {}) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current)
      return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold,
        root,
        rootMargin,
      },
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, threshold, root, rootMargin])

  return isVisible
}

import * as React from 'react'

const visibilityToThreshold = (
  visibility: 'full' | 'some' | 'half' | number
): number => {
  if (typeof visibility === 'number') {
    return visibility
  }
  if (visibility === 'full') {
    return 1
  }
  if (visibility === 'half') {
    return 0.5
  }
  return 0
}

export const useIsInViewport = (
  ref: React.RefObject<Element | null>,
  visibility: 'full' | 'some' | 'half' | number = 'some'
) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return
        }
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold: visibilityToThreshold(visibility),
      }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, visibility])

  return isVisible
}

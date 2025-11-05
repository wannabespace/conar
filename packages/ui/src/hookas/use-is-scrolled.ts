import * as React from 'react'

export type ScrollDirection = 'vertical' | 'horizontal' | 'both'

export function useIsScrolled(
  ref: React.RefObject<Element | null>,
  {
    threshold = 10,
    initial = false,
    direction = 'both',
  }: { threshold?: number, initial?: boolean, direction?: ScrollDirection } = {},
) {
  const [isScrolled, setIsScrolled] = React.useState(initial)

  const handleScrollEvent = React.useEffectEvent(() => {
    const element = ref.current

    if (!element)
      return

    const scrollTop = element.scrollTop
    const scrollLeft = element.scrollLeft

    let scrolled = false
    if (direction === 'vertical') {
      scrolled = scrollTop > threshold
    }
    else if (direction === 'horizontal') {
      scrolled = scrollLeft > threshold
    }
    else {
      scrolled = scrollTop > threshold || scrollLeft > threshold
    }

    setIsScrolled(scrolled)
  })

  React.useEffect(() => {
    const element = ref.current

    if (!element)
      return

    const abortController = new AbortController()

    element.addEventListener('scroll', handleScrollEvent, { passive: true, signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [ref, threshold, direction])

  return isScrolled
}

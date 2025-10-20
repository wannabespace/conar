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

  React.useEffect(() => {
    const element = ref.current

    if (!element)
      return

    const handleScroll = () => {
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

      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsScrolled(scrolled)
    }

    handleScroll()

    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [ref, threshold, direction])

  return isScrolled
}

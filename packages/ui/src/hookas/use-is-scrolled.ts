import * as React from 'react'

export function useIsScrolled(
  ref: React.RefObject<Element | null>,
  { threshold = 10, initial = false }: { threshold?: number, initial?: boolean } = {},
): boolean {
  const [isScrolled, setIsScrolled] = React.useState(initial)

  React.useLayoutEffect(() => {
    const element = ref.current

    if (!element)
      return

    const handleScroll = () => {
      const scrollTop = element.scrollTop
      const scrollLeft = element.scrollLeft

      setIsScrolled(scrollTop > threshold || scrollLeft > threshold)
    }

    handleScroll()

    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [ref, threshold])

  return isScrolled
}

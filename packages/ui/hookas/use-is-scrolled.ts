import * as React from 'react'

export function useIsScrolled(
  ref: React.RefObject<Element | null>,
  threshold: number = 10,
): boolean {
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element)
      return

    const handleScroll = () => {
      const scrollTop = element.scrollTop
      setIsScrolled(scrollTop > threshold)
    }

    handleScroll()

    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [ref, threshold])

  return isScrolled
}

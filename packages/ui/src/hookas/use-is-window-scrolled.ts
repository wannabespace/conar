import * as React from 'react'

export function useIsWindowScrolled({ threshold = 10, initial = false }: { threshold?: number, initial?: boolean } = {}) {
  const [isScrolled, setIsScrolled] = React.useState(initial)

  React.useLayoutEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const scrollLeft = window.scrollX

      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsScrolled(scrollTop > threshold || scrollLeft > threshold)
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return isScrolled
}

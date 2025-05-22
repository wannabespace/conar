import * as React from 'react'

type ScrollDirection = 'up' | 'down' | 'left' | 'right' | null

interface ScrollState {
  direction: ScrollDirection
  lastScrollY: number
  lastScrollX: number
}

export function useScrollDirection(ref?: React.RefObject<HTMLElement | null>) {
  const [scrollState, setScrollState] = React.useState<ScrollState>({
    direction: null,
    lastScrollY: 0,
    lastScrollX: 0,
  })

  React.useEffect(() => {
    const element = ref ? ref.current : window

    if (!element)
      return

    function handleScroll() {
      const currentScrollY = element === window ? window.scrollY : (element as HTMLElement).scrollTop
      const currentScrollX = element === window ? window.scrollX : (element as HTMLElement).scrollLeft

      if (currentScrollY > scrollState.lastScrollY) {
        setScrollState(prev => ({ ...prev, direction: 'down' }))
      }
      else if (currentScrollY < scrollState.lastScrollY) {
        setScrollState(prev => ({ ...prev, direction: 'up' }))
      }
      else if (currentScrollX > scrollState.lastScrollX) {
        setScrollState(prev => ({ ...prev, direction: 'right' }))
      }
      else if (currentScrollX < scrollState.lastScrollX) {
        setScrollState(prev => ({ ...prev, direction: 'left' }))
      }

      setScrollState(prev => ({
        ...prev,
        lastScrollY: currentScrollY,
        lastScrollX: currentScrollX,
      }))
    }

    const timeout = setTimeout(() => {
      if (scrollState.direction) {
        setScrollState(prev => ({ ...prev, direction: null }))
      }
    }, 100)

    element.addEventListener('scroll', handleScroll)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
      element.removeEventListener('scroll', handleScroll)
    }
  }, [scrollState.lastScrollY, scrollState.lastScrollX, ref])

  return scrollState.direction
}

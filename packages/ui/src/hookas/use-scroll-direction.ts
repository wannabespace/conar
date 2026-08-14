import * as React from 'react'

export type ScrollDirection = 'up' | 'down' | 'left' | 'right' | null

export const useScrollDirection = (
  ref?: React.RefObject<HTMLElement | null>,
  delay = 500
) => {
  const [scrollDirection, setScrollDirection] =
    React.useState<ScrollDirection>(null)
  const lastScrollRef = React.useRef({ x: 0, y: 0 })
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const element = ref ? ref.current : window

    if (!element) {
      return
    }

    const handleScroll = () => {
      const currentScrollY =
        element === window ? window.scrollY : (element as HTMLElement).scrollTop
      const currentScrollX =
        element === window
          ? window.scrollX
          : (element as HTMLElement).scrollLeft

      let newDirection: ScrollDirection = null

      if (currentScrollY > lastScrollRef.current.y) {
        newDirection = 'down'
      } else if (currentScrollY < lastScrollRef.current.y) {
        newDirection = 'up'
      } else if (currentScrollX > lastScrollRef.current.x) {
        newDirection = 'right'
      } else if (currentScrollX < lastScrollRef.current.x) {
        newDirection = 'left'
      }

      if (newDirection !== scrollDirection) {
        setScrollDirection(newDirection)
      }

      lastScrollRef.current = {
        x: currentScrollX,
        y: currentScrollY,
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setScrollDirection(null)
      }, delay)
    }

    element.addEventListener('scroll', handleScroll)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      element.removeEventListener('scroll', handleScroll)
    }
  }, [scrollDirection, ref, delay])

  return scrollDirection
}

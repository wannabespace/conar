import * as React from 'react'

export interface ScrollInfo {
  left: number
  top: number
  right: number
  bottom: number
}

export const useScrollInfo = (ref: React.RefObject<HTMLElement | null>) => {
  const [scrollInfo, setScrollInfo] = React.useState<ScrollInfo>({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  })

  React.useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    const updateScrollInfo = () => {
      const {
        scrollLeft,
        scrollTop,
        scrollWidth,
        scrollHeight,
        clientWidth,
        clientHeight,
      } = el

      // oxlint-disable-next-line react/set-state-in-effect
      setScrollInfo({
        bottom: scrollHeight - (scrollTop + clientHeight),
        left: scrollLeft,
        right: scrollWidth - (scrollLeft + clientWidth),
        top: scrollTop,
      })
    }

    updateScrollInfo()

    el.addEventListener('scroll', updateScrollInfo)
    window.addEventListener('resize', updateScrollInfo)

    return () => {
      el.removeEventListener('scroll', updateScrollInfo)
      window.removeEventListener('resize', updateScrollInfo)
    }
  }, [ref])

  return scrollInfo
}

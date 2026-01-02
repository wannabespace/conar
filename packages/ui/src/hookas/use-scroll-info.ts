import * as React from 'react'

export interface ScrollInfo {
  left: number
  top: number
  right: number
  bottom: number
}

export function useScrollInfo(ref: React.RefObject<HTMLElement | null>) {
  const [scrollInfo, setScrollInfo] = React.useState<ScrollInfo>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  })

  const updateScrollInfo = React.useCallback(() => {
    const el = ref.current
    if (!el)
      return

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = el

    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setScrollInfo({
      left: scrollLeft,
      top: scrollTop,
      right: scrollWidth - (scrollLeft + clientWidth),
      bottom: scrollHeight - (scrollTop + clientHeight),
    })
  }, [ref])

  React.useEffect(() => {
    const el = ref.current
    if (!el)
      return

    updateScrollInfo()

    el.addEventListener('scroll', updateScrollInfo)
    window.addEventListener('resize', updateScrollInfo)

    return () => {
      el.removeEventListener('scroll', updateScrollInfo)
      window.removeEventListener('resize', updateScrollInfo)
    }
  }, [ref, updateScrollInfo])

  return scrollInfo
}

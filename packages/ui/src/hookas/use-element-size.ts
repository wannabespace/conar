import * as React from 'react'

export function useElementSize<T extends Element>(
  ref: React.RefObject<T | null>,
): { width: number | null, height: number | null }
export function useElementSize<T extends Element>(
  ref: React.RefObject<T | null>,
  initial: {
    width: number
    height: number
  },
): {
  width: number
  height: number
}
export function useElementSize<T extends Element = Element>(
  ref: React.RefObject<T | null>,
  initial?: {
    width: number
    height: number
  },
) {
  const [size, setSize] = React.useState({
    width: initial?.width ?? null,
    height: initial?.height ?? null,
  })

  const previousObserver = React.useRef<ResizeObserver | null>(null)

  React.useEffect(() => {
    const element = ref.current

    if (previousObserver.current) {
      previousObserver.current.disconnect()
      previousObserver.current = null
    }

    let observer: ResizeObserver | null = null

    if (element?.nodeType === Node.ELEMENT_NODE) {
      observer = new ResizeObserver(([entry]) => {
        if (entry && entry.borderBoxSize) {
          const { inlineSize: width, blockSize: height }
            = entry.borderBoxSize[0]!

          setSize(prev => width !== prev.width || height !== prev.height ? { width, height } : prev)
        }
      })

      observer.observe(element, { box: 'border-box' })
      previousObserver.current = observer
    }

    return () => {
      if (previousObserver.current) {
        previousObserver.current.disconnect()
        previousObserver.current = null
      }
    }
  }, [ref])

  return size
}

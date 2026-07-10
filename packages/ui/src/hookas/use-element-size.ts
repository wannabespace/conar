import * as React from 'react'

export function useElementSize<T extends Element>(
  ref: React.RefObject<T | null>,
): { width: number | null; height: number | null }
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

  const previousObserverRef = React.useRef<ResizeObserver | null>(null)

  React.useEffect(() => {
    const element = ref.current

    if (previousObserverRef.current) {
      previousObserverRef.current.disconnect()
      previousObserverRef.current = null
    }

    let observer: ResizeObserver

    if (element?.nodeType === Node.ELEMENT_NODE) {
      observer = new ResizeObserver(([entry]) => {
        if (entry && entry.borderBoxSize) {
          const { inlineSize: width, blockSize: height } = entry.borderBoxSize[0]!

          setSize((prev) =>
            width !== prev.width || height !== prev.height ? { width, height } : prev,
          )
        }
      })

      observer.observe(element, { box: 'border-box' })
      previousObserverRef.current = observer
    }

    return () => {
      if (previousObserverRef.current) {
        previousObserverRef.current.disconnect()
        previousObserverRef.current = null
      }
    }
  }, [ref])

  return size
}

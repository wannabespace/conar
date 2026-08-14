import * as React from 'react'

export function useElementSize<T extends Element>(
  ref: React.RefObject<T | null>
): { width: number | null; height: number | null }
export function useElementSize<T extends Element>(
  ref: React.RefObject<T | null>,
  initial: {
    width: number
    height: number
  }
): {
  width: number
  height: number
}
export function useElementSize<T extends Element = Element>(
  ref: React.RefObject<T | null>,
  initial?: {
    width: number
    height: number
  }
) {
  const [size, setSize] = React.useState({
    height: initial?.height ?? null,
    width: initial?.width ?? null,
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
        const boxSize = entry?.borderBoxSize?.[0]
        if (!boxSize) {
          return
        }
        const { inlineSize: width, blockSize: height } = boxSize

        setSize((prev) =>
          width !== prev.width || height !== prev.height
            ? { height, width }
            : prev
        )
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

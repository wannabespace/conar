import { useEffect, useEffectEvent } from 'react'

export const useEndReached = ({
  count,
  lastIndex,
  onEndReached,
  threshold,
}: {
  count: number
  lastIndex: number
  onEndReached?: () => void
  threshold: number
}) => {
  const reachEnd = useEffectEvent(() => onEndReached?.())
  useEffect(() => {
    if (count > 0 && lastIndex >= count - threshold) {
      reachEnd()
    }
  }, [count, lastIndex, threshold])
}

import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { cn } from '@tamery/ui/lib/utils'
import { useEffect, useState } from 'react'

const elapsedSeconds = (since: number) =>
  Math.round((Date.now() - since) / 1000)

export const ElapsedSeconds = ({
  since,
  className,
}: {
  since: number
  className?: string
}) => {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(since))

  useEffect(() => {
    const interval = setInterval(() => setSeconds(elapsedSeconds(since)), 1000)

    return () => clearInterval(interval)
  }, [since])

  return (
    <NumberFlow
      value={seconds}
      suffix="s"
      className={cn('tabular-nums', className)}
    />
  )
}

import { cn } from '@tamery/ui/lib/utils'
import { formatDistance } from 'date-fns'
import { useEffect, useState } from 'react'

import { useShareRows } from '../-lib/use-share-rows'

const FRESH_AGE = 'less than a minute'
const MINUTE_MS = 60 * 1000

export const UpdatedAt = () => {
  const { data } = useShareRows()
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), MINUTE_MS)
    return () => clearInterval(tick)
  }, [])
  const age = formatDistance(data.pages[0]?.fetchedAt ?? now, now)
  return (
    <p
      className={cn(
        'text-muted-foreground text-xs',
        age === FRESH_AGE && 'invisible'
      )}
    >
      {`Updated ${age} ago`}
    </p>
  )
}

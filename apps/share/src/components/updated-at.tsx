import { cn } from '@tamery/ui/lib/utils'
import { formatDistanceToNow } from 'date-fns'

import { useShareRows } from '~/hooks/use-share-rows'

const FRESH_AGE = 'less than a minute'

export const UpdatedAt = () => {
  const { data } = useShareRows()
  const [first] = data.pages
  if (first?.status !== 'ready') {
    return null
  }
  const age = formatDistanceToNow(first.fetchedAt)
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

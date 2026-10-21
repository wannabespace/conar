import { Alert02Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@tamery/ui/components/button'
import { EmptyContent } from '@tamery/ui/components/empty'
import { useRouter } from '@tanstack/react-router'

import { EmptyState } from './empty-state'

export const STATUSES = {
  gone: {
    description: 'The link expired, or its owner stopped sharing the table.',
    icon: LinkSquare02Icon,
    title: 'This link is not shared anymore',
  },
  unavailable: {
    description:
      'The database behind this link is not answering. Try again in a little while.',
    icon: Alert02Icon,
    title: 'This table cannot be loaded right now',
  },
}

export const StatusPage = ({ status }: { status: keyof typeof STATUSES }) => {
  const router = useRouter()

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState {...STATUSES[status]}>
        {status === 'unavailable' && (
          <EmptyContent>
            <Button variant="outline" onClick={() => router.invalidate()}>
              Try again
            </Button>
          </EmptyContent>
        )}
      </EmptyState>
    </main>
  )
}

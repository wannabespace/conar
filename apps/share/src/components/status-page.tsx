import { Alert02Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@tamery/ui/components/button'
import { IconEmpty } from '@tamery/ui/components/custom/icon-empty'
import { EmptyContent } from '@tamery/ui/components/empty'
import { useRouter } from '@tanstack/react-router'

const STATUSES = {
  error: {
    description: 'This page could not be loaded. Try again in a little while.',
    icon: Alert02Icon,
    title: 'Something went wrong',
  },
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
      <IconEmpty size="default" {...STATUSES[status]}>
        {status !== 'gone' && (
          <EmptyContent>
            <Button variant="outline" onClick={() => router.invalidate()}>
              Try again
            </Button>
          </EmptyContent>
        )}
      </IconEmpty>
    </main>
  )
}

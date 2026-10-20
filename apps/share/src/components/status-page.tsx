import { Alert02Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { useRouter } from '@tanstack/react-router'

const STATUSES = {
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
  const { description, icon, title } = STATUSES[status]

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="muted">
            <HugeiconsIcon icon={icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {status === 'unavailable' && (
          <EmptyContent>
            <Button variant="outline" onClick={() => router.invalidate()}>
              Try again
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </main>
  )
}

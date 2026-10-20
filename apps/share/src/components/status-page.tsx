import { Alert02Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <HugeiconsIcon
        icon={icon}
        strokeWidth={2}
        className="text-muted-foreground size-8"
      />
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm text-balance">
        {description}
      </p>
      {status === 'unavailable' && (
        <Button variant="outline" onClick={() => router.invalidate()}>
          Try again
        </Button>
      )}
    </main>
  )
}

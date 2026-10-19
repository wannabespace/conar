import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toError } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { ThemeObserver } from '@tamery/ui/theme-observer'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link, useRouter } from '@tanstack/react-router'

export const ErrorPage = ({ error: thrown }: ErrorComponentProps) => {
  const router = useRouter()
  const error = toError(thrown)

  return (
    <>
      <ThemeObserver />
      <main className="flex min-h-dvh items-center justify-center p-4">
        <Empty className="w-full max-w-xl">
          <EmptyHeader>
            <EmptyMedia variant="destructive">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Something went wrong</EmptyTitle>
            <EmptyDescription>{error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => router.invalidate()} variant="outline">
              Try again
            </Button>
            <Button render={<Link to="/" />}>Docs home</Button>
          </EmptyContent>
        </Empty>
      </main>
    </>
  )
}

import {
  Alert02Icon,
  ArrowTurnBackwardIcon,
  Refresh01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toError } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@tamery/ui/components/collapsible'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { Toaster } from '@tamery/ui/components/sonner'
import { ThemeObserver } from '@tamery/ui/theme-observer'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'

export const ErrorPage = ({ error: thrown }: ErrorComponentProps) => {
  const router = useRouter()
  const error = toError(thrown)

  return (
    <>
      <ThemeObserver />
      <Toaster />
      <main className="flex min-h-dvh items-center justify-center p-4">
        <Empty className="w-full max-w-xl">
          <EmptyHeader>
            <EmptyMedia variant="destructive">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Something went wrong</EmptyTitle>
            <EmptyDescription>
              <code data-mask className="font-mono wrap-break-word select-text">
                {error.message}
              </code>
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.history.back()}>
                <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
                Go back
              </Button>
              <Button onClick={() => window.location.reload()}>
                <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                Reload
              </Button>
            </div>
            {error.stack && (
              <Collapsible className="flex w-full flex-col items-center">
                <CollapsibleTrigger
                  render={<Button variant="ghost-muted" size="sm" />}
                >
                  Show details
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 w-full">
                  <CodeBlock
                    variant="field"
                    size="xs"
                    wrap
                    language="text"
                    code={error.stack}
                    className="max-h-72 text-left"
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </EmptyContent>
        </Empty>
      </main>
    </>
  )
}

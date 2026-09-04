import {
  Alert02Icon,
  ArrowTurnBackwardIcon,
  Refresh01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { Toaster } from '@tamery/ui/components/sonner'
import { ThemeObserver } from '@tamery/ui/theme-observer'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { TraversalError } from 'arktype'

export const ErrorPage = ({ error }: ErrorComponentProps) => {
  const router = useRouter()

  return (
    <>
      <ThemeObserver />
      <Toaster />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative z-20 w-full max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <div className="bg-destructive/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                <HugeiconsIcon
                  icon={Alert02Icon}
                  strokeWidth={2}
                  className="text-destructive size-8"
                />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An error occurred while rendering this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!(error instanceof TraversalError) && !error.stack && (
                <ScrollArea className="bg-muted text-muted-foreground h-50 rounded-md p-4 text-sm">
                  {error.message}
                </ScrollArea>
              )}
              {!(error instanceof TraversalError) && error.stack && (
                <ScrollArea className="bg-muted text-muted-foreground h-75 rounded-md p-4 font-mono text-xs">
                  {error.stack}
                </ScrollArea>
              )}
              {error instanceof TraversalError && (
                <ScrollArea className="bg-muted text-muted-foreground h-75 rounded-md p-4 font-mono text-xs">
                  {error.arkErrors.map((err, index) => (
                    <div key={err.message} className="mb-4 last:mb-0">
                      <div className="text-destructive font-semibold">
                        Error {index + 1}:
                      </div>
                      <div className="mt-1 ml-2">
                        <div>{err.message}</div>
                      </div>
                    </div>
                  ))}
                  {error.stack && (
                    <div className="mt-4">
                      <h3 className="mb-2 text-sm font-medium">Stack</h3>
                      <div className="bg-muted text-muted-foreground rounded-md font-mono text-xs">
                        {error.stack}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.history.back()}
              >
                <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
                Go back
              </Button>
              <Button
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}

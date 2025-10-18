import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@conar/ui/components/card'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Toaster } from '@conar/ui/components/sonner'
import { ThemeObserver } from '@conar/ui/theme-observer'
import { RiAlertLine, RiArrowGoBackLine, RiHomeLine, RiLoopLeftLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { TraversalError } from 'arktype'
import posthog from 'posthog-js'
import { useEffect } from 'react'
import { enterAppAnimation } from './enter'
import { EventsProvider } from './lib/events'

// User specific errors that we don't want to track
const CONNECTION_ERRORS = [
  'ERR_TIMED_OUT',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNRESET',
  'ECONNREFUSED',
  'Password authentication',
  'No pg_hba.conf entry for host',
  'Could not connect to database',
  'Password authentication failed for user',
]

export function ErrorPage({ error }: ErrorComponentProps) {
  const router = useRouter()

  useEffect(() => {
    enterAppAnimation()
  }, [])

  useEffect(() => {
    if (CONNECTION_ERRORS.some(e => e.includes(error.message))) {
      return
    }

    posthog.captureException(error)
  }, [error])

  return (
    <EventsProvider>
      <ThemeObserver />
      <Toaster />
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative z-20 w-full max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <RiAlertLine className="size-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                {CONNECTION_ERRORS.some(e => error.message.includes(e))
                  ? 'Check your database connection settings and network.'
                  : 'An error occurred while rendering this page'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!(error instanceof TraversalError) && !error.stack && (
                <ScrollArea className="rounded-md bg-muted p-4 text-sm text-muted-foreground h-[200px]">
                  {error.message}
                </ScrollArea>
              )}
              {!(error instanceof TraversalError) && error.stack && (
                <ScrollArea className="rounded-md bg-muted p-4 text-xs text-muted-foreground h-[300px] font-mono">
                  {error.stack}
                </ScrollArea>
              )}
              {error instanceof TraversalError && (
                <ScrollArea className="rounded-md bg-muted p-4 text-xs text-muted-foreground h-[300px] font-mono">
                  {error.arkErrors.map((err, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="font-semibold text-destructive">
                        Error
                        {' '}
                        {index + 1}
                        :
                      </div>
                      <div className="ml-2 mt-1">
                        <div>
                          {err.message}
                        </div>
                      </div>
                    </div>
                  ))}
                  {error.stack && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Stack</h3>
                      <div className="rounded-md bg-muted text-xs text-muted-foreground font-mono">
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
                <RiArrowGoBackLine className="mr-1" />
                Go back
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => router.navigate({ to: '/' })}
              >
                <RiHomeLine className="mr-1" />
                Home
              </Button>
              <Button
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                <RiLoopLeftLine className="mr-1" />
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </EventsProvider>
  )
}

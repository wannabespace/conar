import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@conar/ui/components/card'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Toaster } from '@conar/ui/components/sonner'
import { ThemeObserver } from '@conar/ui/theme-observer'
import { RiAlertLine, RiArrowGoBackLine, RiLoopLeftLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { TraversalError } from 'arktype'

export function ErrorPage({ error }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <>
      <ThemeObserver />
      <Toaster />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative z-20 w-full max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <div className={`
                mx-auto mb-4 flex size-16 items-center justify-center
                rounded-full bg-destructive/10
              `}
              >
                <RiAlertLine className="size-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An error occurred while rendering this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!(error instanceof TraversalError) && !error.stack && (
                <ScrollArea className={`
                  h-[200px] rounded-md bg-muted p-4 text-sm
                  text-muted-foreground
                `}
                >
                  {error.message}
                </ScrollArea>
              )}
              {!(error instanceof TraversalError) && error.stack && (
                <ScrollArea className={`
                  h-[300px] rounded-md bg-muted p-4 font-mono text-xs
                  text-muted-foreground
                `}
                >
                  {error.stack}
                </ScrollArea>
              )}
              {error instanceof TraversalError && (
                <ScrollArea className={`
                  h-[300px] rounded-md bg-muted p-4 font-mono text-xs
                  text-muted-foreground
                `}
                >
                  {error.arkErrors.map((err, index) => (

                    <div
                      key={index}
                      className={`
                        mb-4
                        last:mb-0
                      `}
                    >
                      <div className="font-semibold text-destructive">
                        Error
                        {' '}
                        {index + 1}
                        :
                      </div>
                      <div className="mt-1 ml-2">
                        <div>
                          {err.message}
                        </div>
                      </div>
                    </div>
                  ))}
                  {error.stack && (
                    <div className="mt-4">
                      <h3 className="mb-2 text-sm font-medium">Stack</h3>
                      <div className={`
                        rounded-md bg-muted font-mono text-xs
                        text-muted-foreground
                      `}
                      >
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
                onClick={() => window.location.reload()}
              >
                <RiLoopLeftLine className="mr-1" />
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}

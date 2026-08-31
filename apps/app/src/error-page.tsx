import { RiAlertLine, RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { Toaster } from '@tamery/ui/components/sonner'
import { cn } from '@tamery/ui/lib/utils'
import { ThemeObserver } from '@tamery/ui/theme-observer'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { TraversalError } from 'arktype'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { EventsProvider } from '~/events'
import { posthog } from '~/lib/posthog'

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

const getStack = (error: ErrorComponentProps['error']) => {
  if (!error.stack) {
    return null
  }

  return error.stack.startsWith(`Error: ${error.message}`)
    ? error.stack.split('\n').slice(1).join('\n')
    : error.stack
}

const isReadableMessage = (message: string) => {
  const trimmed = message.trim()
  return !trimmed.startsWith('{') && !trimmed.startsWith('[')
}

export const ErrorPage = ({ error }: ErrorComponentProps) => {
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (CONNECTION_ERRORS.some((e) => error.message.includes(e))) {
      return
    }

    posthog.captureException(error)
  }, [error])

  const isConnectionError = CONNECTION_ERRORS.some((e) =>
    error.message.includes(e)
  )
  const isValidationError = error instanceof TraversalError
  const stack = getStack(error)
  const cause =
    error.cause && !String(error.cause).includes(error.message)
      ? String(error.cause)
      : null
  const arkErrors = isValidationError ? error.arkErrors : null

  let description = 'An unexpected error occurred while showing this page.'
  if (isConnectionError) {
    description =
      'Check your database connection settings and network, then try again.'
  } else if (isValidationError) {
    description = 'Some data did not match the format the app expected.'
  }

  const summary = isReadableMessage(error.message)
    ? error.message.split('\n')[0]
    : null

  const details = arkErrors?.length
    ? arkErrors.map((err, index) => `${index + 1}. ${err.message}`).join('\n\n')
    : [error.message, cause, stack].filter(Boolean).join('\n\n')

  return (
    <EventsProvider>
      <ThemeObserver />
      <Toaster />
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="relative flex w-full max-w-lg flex-col items-center"
        >
          <div className="border-destructive/10 bg-destructive/10 mb-5 flex size-14 items-center justify-center rounded-2xl border">
            <RiAlertLine className="text-destructive size-7" />
          </div>

          <h1 className="text-base font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-sm text-center text-sm">
            {description}
          </p>

          {summary && (
            <p
              data-mask
              className="text-2xs text-muted-foreground/70 mt-4 max-w-md text-center font-mono leading-relaxed"
            >
              {summary}
            </p>
          )}

          <div className="mt-7 flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => router.history.back()}
            >
              Go back
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => router.navigate({ to: '/' })}
            >
              Home
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>

          <div className="text-muted-foreground/70 mt-5 flex items-center gap-1 text-xs">
            <CopyButton
              variant="ghost"
              size="xs"
              text={details}
              copyIcon={<RiFileCopyLine className="size-3" />}
              successIcon={<RiCheckLine className="text-success size-3" />}
              className="text-muted-foreground/70 hover:text-foreground h-6 gap-1 px-1.5 font-normal hover:bg-transparent"
            >
              Copy details
            </CopyButton>
            <span aria-hidden>·</span>
            <button
              type="button"
              className="hover:text-foreground focus-visible:text-foreground cursor-default rounded-md px-1.5 py-0.5 outline-none"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>

          <div
            className={cn(
              'grid w-full transition-[grid-template-rows] duration-200',
              showDetails ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <ScrollArea
                data-mask
                className="text-2xs text-muted-foreground/80 mt-4 max-h-56 border-t pt-4 text-left font-mono leading-relaxed whitespace-pre-wrap"
              >
                {details}
              </ScrollArea>
            </div>
          </div>
        </motion.div>
      </div>
    </EventsProvider>
  )
}

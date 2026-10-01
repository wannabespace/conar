import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { motion } from 'motion/react'
import { useState } from 'react'

const errorCauseText = (cause: unknown) => {
  if (cause === null || cause === undefined) {
    return null
  }

  if (cause instanceof Error) {
    return cause.message
  }

  if (typeof cause === 'object') {
    try {
      return JSON.stringify(cause, null, 2)
    } catch {
      return String(cause)
    }
  }

  return String(cause)
}

export const TableError = ({ error }: { error: Error }) => {
  const [showDetails, setShowDetails] = useState(false)

  const [summary] = error.message.split('\n')
  const rawCause = errorCauseText(error.cause)
  const cause =
    rawCause && !(error.message && rawCause.includes(error.message))
      ? rawCause
      : null
  const details = [error.message, cause].filter(Boolean).join('\n\n')
  const hasDetails = details !== summary

  return (
    <div className="pointer-events-none sticky left-0 flex h-full overflow-hidden pb-12">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="pointer-events-auto flex min-w-0 flex-1"
      >
        <Empty className="p-4 md:p-4">
          <EmptyHeader className="max-w-md gap-1">
            <EmptyMedia
              variant="icon"
              className="bg-destructive/10 text-destructive mb-3 size-14 rounded-2xl [&_svg]:size-7"
            >
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle className="text-sm font-medium tracking-normal">
              Query failed
            </EmptyTitle>
            <EmptyDescription
              data-mask
              className="font-mono text-xs wrap-break-word select-text"
            >
              {summary}
            </EmptyDescription>
          </EmptyHeader>

          {hasDetails && (
            <EmptyContent className="max-w-lg gap-2">
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
                onClick={() => setShowDetails((prev) => !prev)}
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </Button>
              <motion.div
                initial={false}
                animate={{ gridTemplateRows: showDetails ? '1fr' : '0fr' }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="grid w-full"
              >
                <div className="min-h-0 overflow-hidden">
                  <ScrollArea
                    data-mask
                    className="bg-muted/60 text-2xs text-muted-foreground max-h-56 rounded-lg p-3 text-left font-mono leading-relaxed whitespace-pre-wrap select-text"
                  >
                    {details}
                  </ScrollArea>
                </div>
              </motion.div>
            </EmptyContent>
          )}
        </Empty>
      </motion.div>
    </div>
  )
}

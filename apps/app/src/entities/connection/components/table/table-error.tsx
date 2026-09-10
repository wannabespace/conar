import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
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
    <div className="pointer-events-none sticky left-0 flex h-full items-center justify-center overflow-hidden p-6 pb-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="pointer-events-auto relative flex w-full max-w-lg flex-col items-center"
      >
        <div className="border-destructive/10 bg-destructive/10 mb-5 flex size-14 items-center justify-center rounded-2xl border">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="text-destructive size-7"
          />
        </div>

        <h2 className="text-base font-semibold tracking-tight">Query failed</h2>
        <p className="text-muted-foreground mt-1.5 text-center text-sm">
          Check your filters and try again.
        </p>

        <p
          data-mask
          className="text-2xs text-muted-foreground/70 mt-4 max-w-md text-center font-mono leading-relaxed"
        >
          {summary}
        </p>

        {hasDetails && (
          <button
            type="button"
            className="text-muted-foreground/70 hover:text-foreground focus-visible:text-foreground mt-5 cursor-default rounded-md px-1.5 py-0.5 text-xs outline-none"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        )}

        {hasDetails && (
          <motion.div
            initial={false}
            animate={{ gridTemplateRows: showDetails ? '1fr' : '0fr' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="grid w-full"
          >
            <div className="min-h-0 overflow-hidden">
              <ScrollArea
                data-mask
                className="text-2xs text-muted-foreground/80 mt-4 max-h-56 border-t pt-4 text-left font-mono leading-relaxed whitespace-pre-wrap"
              >
                {details}
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

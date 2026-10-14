import { Alert02Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionParts } from '@tamery/connection/connection-parts'
import { mergeOptions } from '@tamery/connection/connection-parts'
import type { ConnectionPatch, Diagnosis } from '@tamery/connection/diagnose'
import { diagnoseConnectionError } from '@tamery/connection/diagnose'
import { diagnosisRequestOf } from '@tamery/connection/diagnosis-request'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { motion } from 'motion/react'
import { useState } from 'react'

import { checkOrUpgrade } from '~/core/user/permissions'

import { useAiHelp } from '../-lib/use-ai-help'

export type FixSource = 'ai' | 'rule'

// Module scope keeps the ref callback's identity, so it scrolls once on mount and never on a later render.
const scrollIntoView = (node: HTMLElement | null) =>
  node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

const FOCUS_LABELS: Record<NonNullable<Diagnosis['focus']>, string> = {
  password: 'Edit the password',
  user: 'Edit the user',
}

export const TestAlert = ({
  error,
  onAnswer,
  onFix,
  onFocus,
  parts,
}: {
  error: Error
  /** Ask AI unmounts once its answer lands, so focus has to go somewhere. */
  onAnswer: () => void
  onFix: (patch: ConnectionPatch, source: FixSource) => void
  onFocus: (field: NonNullable<Diagnosis['focus']>) => void
  parts: ConnectionParts
}) => {
  const context = { desktop: !!window.electron, message: error.message, parts }
  const diagnosis = diagnoseConnectionError(context)
  const { ask, available, exhausted, locked } = useAiHelp()
  const answer = ask.data
  const aiFix = answer?.fix
  const { fix, focus } = diagnosis ?? {}

  const [showError, setShowError] = useState(false)

  return (
    <motion.div
      ref={scrollIntoView}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
    >
      <Alert variant="error">
        <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
        <AlertTitle>{diagnosis?.title ?? "Couldn't connect"}</AlertTitle>
        <AlertDescription className="select-text">
          <div className="flex flex-col gap-2">
            {answer ? (
              <div className="flex flex-col gap-1">
                <span>{answer.explanation}</span>
                {answer.steps.length > 0 && (
                  <ol className="list-decimal pl-4">
                    {answer.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            ) : (
              diagnosis && <span>{diagnosis.hint}</span>
            )}
            {(!diagnosis || showError) && (
              <span data-mask className="font-mono text-xs wrap-break-word">
                {error.message}
              </span>
            )}
            {ask.error && <span>{ask.error.message}</span>}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {fix && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onFix(fix.patch, 'rule')}
                >
                  {fix.label}
                </Button>
              )}
              {focus && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onFocus(focus)}
                >
                  {FOCUS_LABELS[focus]}
                </Button>
              )}
              {aiFix && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    onFix(
                      {
                        database: aiFix.database ?? undefined,
                        options:
                          aiFix.options === null
                            ? undefined
                            : mergeOptions(parts.options, aiFix.options),
                        port: aiFix.port ?? undefined,
                        sshEnabled: aiFix.sshEnabled ?? undefined,
                        type: aiFix.type ?? undefined,
                      },
                      'ai'
                    )
                  }
                >
                  {aiFix.label}
                </Button>
              )}
              {available && !answer && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="xs"
                        className={locked ? 'opacity-50' : undefined}
                        disabled={ask.isPending}
                        onClick={() =>
                          checkOrUpgrade(
                            exhausted
                              ? 'ai.connection.unlimited'
                              : 'ai.connection.use'
                          ) &&
                          ask.mutate(
                            {
                              ...diagnosisRequestOf(context),
                              type: parts.type ?? ConnectionType.Postgres,
                            },
                            { onSuccess: onAnswer }
                          )
                        }
                      >
                        <LoadingContent loading={ask.isPending}>
                          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                          Ask AI
                        </LoadingContent>
                      </Button>
                    }
                  />
                  <TooltipContent>
                    Your password, host and user are never sent, only the error
                  </TooltipContent>
                </Tooltip>
              )}
              {diagnosis && (
                <Button
                  variant="ghost-muted"
                  size="xs"
                  className="ml-auto"
                  onClick={() => setShowError((shown) => !shown)}
                >
                  {showError ? 'Hide error' : 'Show error'}
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}

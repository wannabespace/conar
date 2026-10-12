import { Alert02Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionParts } from '@tamery/connection/connection-parts'
import type { ConnectionPatch, Diagnosis } from '@tamery/connection/diagnose'
import {
  diagnoseConnectionError,
  diagnosisRequestOf,
} from '@tamery/connection/diagnose'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { useState } from 'react'

import { useAiHelp } from '../-lib/use-ai-help'

export type FixSource = 'ai' | 'rule'

const FOCUS_LABELS: Record<NonNullable<Diagnosis['focus']>, string> = {
  password: 'Edit the password',
  user: 'Edit the user',
}

export const TestAlert = ({
  error,
  onFix,
  onFocus,
  parts,
}: {
  error: Error
  onFix: (patch: ConnectionPatch, source: FixSource) => void
  onFocus: (field: NonNullable<Diagnosis['focus']>) => void
  parts: ConnectionParts
}) => {
  const desktop = !!window.electron
  const diagnosis = diagnoseConnectionError({
    desktop,
    message: error.message,
    parts,
  })
  const { ask, available } = useAiHelp()
  const answer = ask.data
  const aiFix = answer?.fix
  const { fix, focus } = diagnosis ?? {}

  const [showError, setShowError] = useState(false)

  return (
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
                    Object.fromEntries(
                      Object.entries(aiFix).filter(
                        ([key, value]) => key !== 'label' && value !== null
                      )
                    ),
                    'ai'
                  )
                }
              >
                {aiFix.label}
              </Button>
            )}
            {available && !answer && (
              <Button
                variant="ghost"
                size="xs"
                disabled={ask.isPending}
                onClick={() =>
                  ask.mutate({
                    ...diagnosisRequestOf({
                      desktop,
                      message: error.message,
                      parts,
                    }),
                    type: parts.type ?? ConnectionType.Postgres,
                  })
                }
              >
                <LoadingContent loading={ask.isPending}>
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                  Ask AI
                </LoadingContent>
              </Button>
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
  )
}

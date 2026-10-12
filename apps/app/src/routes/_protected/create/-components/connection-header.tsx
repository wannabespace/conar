import { PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { GuessFix } from '@tamery/connection/guess'
import { suggestConnectionName } from '@tamery/connection/guess/name'
import { FieldDescription } from '@tamery/ui/components/field'
import { cn } from '@tamery/ui/lib/utils'
import { useStore } from '@tanstack/react-form'
import type { CSSProperties } from 'react'

import { ConnectionIcon } from '~/core/connection/connection-icon'

import type { ConnectionForm } from '../-lib/connection-form'
import { missingOf } from '../-lib/connection-form'
import { ENGINE_LABELS } from './engine-field'

const FIX_NOTES: Record<GuessFix, string> = {
  'neon-direct':
    'Using the direct endpoint — the pooler drops transactions between queries.',
  'password-placeholder': 'The password was a placeholder.',
  'session-pooler':
    'Port 6543 → 5432: session mode keeps transactions between queries.',
}

export const ConnectionHeader = ({
  filled,
  fixes,
  form,
}: {
  filled: boolean
  fixes: GuessFix[]
  form: ConnectionForm
}) => {
  const type = useStore(form.store, ({ values }) => values.type)
  const color = useStore(form.store, ({ values }) => values.color)
  const summary = useStore(form.store, ({ values }) =>
    values.host.trim()
      ? [
          ENGINE_LABELS[values.type],
          values.port ? `${values.host}:${values.port}` : values.host,
          values.sshEnabled && values.ssh.host && `via ${values.ssh.host}`,
        ]
          .filter(Boolean)
          .join(' · ')
      : null
  )
  const missing = useStore(form.store, ({ values }) => missingOf(values))
  const suggestion = useStore(form.store, ({ values }) =>
    suggestConnectionName(values)
  )

  return (
    <header className="flex flex-col items-center gap-4 pb-3">
      <div
        className={cn(
          'flex size-16 items-center justify-center rounded-2xl shadow-xs ring transition-colors',
          color
            ? 'bg-(--swatch)/15 ring-(--swatch)/40'
            : 'bg-card ring-foreground/4'
        )}
        style={color ? ({ '--swatch': color } as CSSProperties) : undefined}
      >
        <ConnectionIcon type={type} className="size-8" />
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <form.AppField name="name">
          {(field) => (
            <field.Input
              variant="title"
              aria-label="Name"
              data-mask
              autoComplete="off"
              placeholder={suggestion ?? 'Connection name'}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} />
            </field.Input>
          )}
        </form.AppField>
        <FieldDescription className="max-w-full truncate text-center">
          {summary ? (
            <>
              <span data-mask>{summary}</span>
              {filled &&
                missing.length > 0 &&
                ` — add the ${missing.join(' and ')}`}
            </>
          ) : (
            'Paste a connection anywhere to fill it in.'
          )}
        </FieldDescription>
        {filled &&
          fixes.map((fix) => (
            <FieldDescription key={fix} size="sm" className="text-center">
              {FIX_NOTES[fix]}
            </FieldDescription>
          ))}
      </div>
    </header>
  )
}

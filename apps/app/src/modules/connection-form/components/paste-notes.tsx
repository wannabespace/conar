import type { GuessFix } from '@tamery/connection/guess'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { useSelector } from '@tanstack/react-form'
import { AnimatePresence } from 'motion/react'

import type { ConnectionForm } from '../lib/connection-form'
import { getMissing } from '../lib/connection-form'
import { getFieldLabel } from '../lib/sqlite-location'
import { Footnote } from './footnote'

const FIX_NOTES: Record<GuessFix, string> = {
  'clickhouse-http':
    "Using ClickHouse's HTTP port, since Tamery connects over HTTP, not the native protocol.",
  'neon-direct':
    'Using the direct endpoint, since the pooler drops transactions between queries.',
  'pooler-port':
    'Using port 5432, since the transaction pooler drops transactions between queries.',
  'prisma-options':
    'Dropped the Prisma-only options, which the database would reject.',
  'ssh-forward': 'Connecting to the forwarded server through the SSH tunnel.',
}

export const PasteNotes = ({
  fixes,
  form,
  passwordWithheldBy,
}: {
  fixes: GuessFix[]
  form: ConnectionForm
  passwordWithheldBy?: string
}) => {
  const missing = useSelector(form.store, ({ values }) => getMissing(values))
  const labels = useSelector(form.store, ({ values }) =>
    missing.map((field) => getFieldLabel(values, field))
  )
  const withheld =
    passwordWithheldBy && missing.includes('password')
      ? ` (${passwordWithheldBy} keeps it in the Keychain)`
      : ''

  const note = [
    ...(missing.length > 0
      ? [`Add the ${labels.join(' and ')}${withheld}.`]
      : []),
    ...fixes.map((fix) => FIX_NOTES[fix]),
  ].join(' ')

  return (
    <AnimatePresence initial={false}>
      {note && (
        <MotionCollapse key={note}>
          <Footnote>{note}</Footnote>
        </MotionCollapse>
      )}
    </AnimatePresence>
  )
}

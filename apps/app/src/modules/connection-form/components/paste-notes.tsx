import type { GuessFix } from '@tamery/connection/guess'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { useStore } from '@tanstack/react-form'
import { AnimatePresence } from 'motion/react'

import type { ConnectionForm } from '../lib/connection-form'
import { missingOf } from '../lib/connection-form'
import { Footnote } from './footnote'

const FIX_NOTES: Record<GuessFix, string> = {
  'neon-direct':
    'Using the direct endpoint, since the pooler drops transactions between queries.',
  'session-pooler':
    'Port 6543 → 5432: session mode keeps transactions between queries.',
}

export const PasteNotes = ({
  fixes,
  form,
}: {
  fixes: GuessFix[]
  form: ConnectionForm
}) => {
  const missing = useStore(form.store, ({ values }) => missingOf(values))

  const note = [
    ...(missing.length > 0 ? [`Add the ${missing.join(' and ')}.`] : []),
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

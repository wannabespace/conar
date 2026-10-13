import type { GuessFix } from '@tamery/connection/guess'
import { useStore } from '@tanstack/react-form'

import type { ConnectionForm } from '../-lib/connection-form'
import { missingOf } from '../-lib/connection-form'
import { Footnote } from './footnote'

const FIX_NOTES: Record<GuessFix, string> = {
  'neon-direct':
    'Using the direct endpoint, since the pooler drops transactions between queries.',
  'password-placeholder': 'The password was a placeholder.',
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

  return (
    <>
      {missing.length > 0 && (
        <Footnote>Add the {missing.join(' and ')}.</Footnote>
      )}
      {fixes.map((fix) => (
        <Footnote key={fix}>{FIX_NOTES[fix]}</Footnote>
      ))}
    </>
  )
}

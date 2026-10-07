import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Spinner } from '@tamery/ui/components/spinner'

import type { ResultSet } from '~/core/queries/connection/custom'
import { plural } from '~/lib/plural'

import type { Impact } from './approval'
import { PREVIEW_BUDGET_MS } from './approval'

const PREVIEW_BUDGET_SECONDS = PREVIEW_BUDGET_MS / 1000

const changedRows = (sets: ResultSet[]) =>
  sets.reduce(
    // A write with RETURNING (or OUTPUT) reports its rows instead of a count.
    (sum, set) => sum + (set.affectedRows ?? set.rows.length),
    0
  )

const summary = (
  impact: Exclude<Impact, { state: 'failed' }>,
  writesRows: boolean,
  estimate: number | undefined
) => {
  if (impact.state === 'checking') {
    return 'Trying it in a transaction that rolls back…'
  }
  if (impact.state === 'unavailable') {
    return 'No preview: rolling back would not undo this statement on this database.'
  }
  if (impact.state === 'tooSlow') {
    return estimate === undefined
      ? `Stopped trying it after ${PREVIEW_BUDGET_SECONDS} s, so it may be a large change.`
      : `Stopped trying it after ${PREVIEW_BUDGET_SECONDS} s.`
  }
  if (!writesRows) {
    return 'Runs without errors, tried in a transaction that rolled back.'
  }
  const changed = changedRows(impact.sets)
  return `${changed ? `Changes ${plural(changed, 'row')}` : 'Matches no rows, so it changes nothing'}, tried in a transaction that rolled back.`
}

/** `writesRows`: whether the statement writes data; a schema change reports no row count. */
export const ImpactNote = ({
  estimate,
  impact,
  writesRows,
}: {
  estimate?: number
  impact: Impact
  writesRows: boolean
}) => {
  if (impact.state === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertDescription data-mask className="wrap-break-word">
          It fails: {impact.error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      {impact.state === 'checking' && <Spinner className="size-3" />}
      <span>
        {summary(impact, writesRows, estimate)}
        {estimate !== undefined &&
          impact.state !== 'checked' &&
          ` The database estimates about ${plural(estimate, 'row')}.`}
      </span>
    </p>
  )
}

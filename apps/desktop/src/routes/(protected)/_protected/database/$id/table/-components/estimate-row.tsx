import type { databases } from '~/drizzle'
import NumberFlow from '@number-flow/react'
import { useTableRowCount } from '~/entities/database/queries'

interface TableRowCounterProps {
  schema: string
  table: string
  database: typeof databases.$inferSelect
}
export function TableRowCounter({ schema, table, database }: TableRowCounterProps) {
  const { data, isLoading } = useTableRowCount({ database, schema, table })
  if (isLoading || !data)
    return <span className="animate-pulse text-[11px] opacity-50">...</span>
  const count = Number(data.count)
  if (!Number.isFinite(count))
    return <span className="text-[11px] text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium">
      <NumberFlow
        value={count}
        format={{ notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }}
        className="font-semibold text-zinc-100 tabular-nums"
      />
      <span className="text-muted-foreground">records</span>
      {data.isEstimated && (
        <span className="font-normal text-muted-foreground opacity-60">
          (estimated)
        </span>
      )}
    </span>
  )
}

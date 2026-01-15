import { Separator } from '@conar/ui/components/separator'
import NumberFlow from '@number-flow/react'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
import { useTableRowCount } from '~/entities/database/queries'
import { Route } from '..'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePageStoreContext } from '../-store'
import { HeaderActions } from './header-actions'
import { HeaderSearch } from './header-search'

export function Header({ table, schema }: { table: string, schema: string }) {
  const { database } = Route.useLoaderData()
  const columns = useTableColumns({ database, table, schema })
  const store = usePageStoreContext()
  const filters = useStore(store, state => state.filters)
  const [enforceExactCount, setEnforceExactCount] = useState(false)
  const { data: rowCount, isLoading } = useTableRowCount({
    database,
    schema,
    table,
    enforceExactCount,
    filters,
  })
  const columnsCount = columns?.length ?? 0
  const count = Number(rowCount?.count)
  let countDisplay
  if (isLoading || !rowCount) {
    countDisplay = <span className="animate-pulse text-[11px] opacity-50">...</span>
  }
  else if (!Number.isFinite(count)) {
    countDisplay = <span className="text-[11px] text-muted-foreground">—</span>
  }
  else {
    countDisplay = (
      <span className="inline-flex items-center gap-1 font-medium">
        <NumberFlow
          value={count}
          format={{ notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }}
          className="font-semibold text-zinc-100 tabular-nums"
        />
        <span className="text-muted-foreground">
          {count === 1 ? 'row' : 'rows'}
        </span>

        {rowCount.isEstimated && (
          <span className="font-normal text-muted-foreground opacity-60">
            (estimated)
          </span>
        )}
        <button
          type="button"
          className={
            'ml-2 rounded border px-1.5 py-0.5 text-[10px] '
            + 'font-normal text-muted-foreground transition-colors '
            + 'hover:bg-muted/30'
          }
          onClick={() => setEnforceExactCount(v => !v)}
          title={enforceExactCount ? 'Show estimated count' : 'Show exact count'}
        >
          {enforceExactCount ? 'Show estimate' : 'Exact count'}
        </button>
      </span>
    )
  }
  return (
    <div className="flex w-full items-center justify-between gap-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="shrink-0">
          <h2 className="mb-0.5 space-x-1 text-sm font-medium">
            <span className="text-muted-foreground">{schema}</span>
            {' '}
            <span className="text-muted-foreground/20">/</span>
            {' '}
            <span data-mask>{table}</span>
          </h2>
          <div
            className={`
              flex h-5 items-center gap-1 text-xs text-muted-foreground
            `}
          >
            <span className="tabular-nums">{columnsCount}</span>
            {' '}
            column
            {columnsCount === 1 ? '' : 's'}
            {' '}
            •
            {' '}
            {countDisplay}
          </div>
        </div>
        <Separator orientation="vertical" className="h-6!" />
        <HeaderSearch table={table} schema={schema} />
      </div>
      <HeaderActions table={table} schema={schema} database={database} />
    </div>
  )
}

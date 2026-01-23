import { Separator } from '@conar/ui/components/separator'
import NumberFlow from '@number-flow/react'
import { useStore } from '@tanstack/react-store'
import { useConnectionTableTotal } from '~/entities/connection/queries'
import { Route } from '../..'
import { useTableColumns } from '../../-queries/use-columns-query'
import { usePageStoreContext } from '../../-store'
import { HeaderActions } from './header-actions'
import { HeaderSearch } from './header-search'

export function Header({ table, schema }: { table: string, schema: string }) {
  const { connection } = Route.useLoaderData()
  const columns = useTableColumns({ connection, table, schema })
  const store = usePageStoreContext()
  const filters = useStore(store, state => state.filters)
  const { data: total } = useConnectionTableTotal({ connection, table, schema, query: { filters } })

  const columnsCount = columns?.length ?? 0

  return (
    <div className="flex w-full items-center justify-between gap-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="shrink-0">
          <h2 className="mb-0.5 space-x-1 text-sm font-medium">
            <span className="text-muted-foreground">
              {schema}
            </span>
            {' '}
            <span className="text-muted-foreground/20">/</span>
            {' '}
            <span data-mask>{table}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            <span className="tabular-nums">{columnsCount}</span>
            {' '}
            column
            {columnsCount === 1 ? '' : 's'}
            {' '}
            •
            {' '}
            {total !== undefined
              ? (
                  <NumberFlow
                    className="tabular-nums"
                    value={total}
                    style={{
                      '--number-flow-mask-height': '0px',
                    }}
                  />
                )
              : <span className="animate-pulse">...</span>}
            {' '}
            row
            {total !== undefined && total !== 1 && 's'}
          </p>
        </div>
        <Separator orientation="vertical" className="h-6!" />
        <HeaderSearch table={table} schema={schema} />
      </div>
      <HeaderActions
        table={table}
        schema={schema}
      />
    </div>
  )
}

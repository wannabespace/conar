import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
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
  const [exact, setExact] = useState(false)
  const { data: total, isLoading } = useConnectionTableTotal({ connection, table, schema, query: { filters, exact } })

  const columnsCount = columns?.length ?? 0
  const count = Number(total?.count)

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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              <span className="tabular-nums">{columnsCount}</span>
              {' '}
              column
              {columnsCount === 1 ? '' : 's'}
            </span>
            <Separator orientation="vertical" className="h-3!" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  className={cn('inline-flex items-center gap-1', !exact && total?.isEstimated && `
                    cursor-pointer
                  `)}
                  onClick={() => setExact(true)}
                >
                  <NumberFlow
                    value={count}
                    format={{ notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }}
                    className={cn('text-muted-foreground tabular-nums', isLoading && `
                      animate-pulse
                    `)}
                    prefix={total?.isEstimated ? '~' : ''}
                    suffix={count === 1 ? ' row' : ' rows'}
                  />
                </TooltipTrigger>
                {!exact && total?.isEstimated && (
                  <TooltipContent side="bottom">
                    Click to get the exact count.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
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

import { HashtagIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { Button } from '@tamery/ui/components/button'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { resourceTableTotalQueryOptions } from '~/core/queries/rows/total'

import { useTableColumnsContext } from '../../lib/columns'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const COMPACT_COUNT_FORMAT = {
  maximumFractionDigits: 1,
  notation: 'compact',
} as const

export const TableStats = ({
  failed,
  filters,
  ready,
  schema,
  table,
}: {
  failed: boolean
  filters: ActiveFilter[]
  ready: boolean
  schema: string
  table: string
}) => {
  const { connectionResource } = useRouteContext()
  const { columns } = useTableColumnsContext()
  const [exact, setExact] = useState(false)
  const {
    data: total,
    dataUpdatedAt,
    isFetching,
  } = useQuery({
    ...resourceTableTotalQueryOptions({
      columns,
      connectionResource,
      query: { exact, filters },
      schema,
      table,
    }),
    enabled: ready,
  })
  const canRequestExact = !failed && !exact && total?.isEstimated === true

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex" />}>
        <Button
          variant="outline"
          disabled={!canRequestExact}
          // oxlint-disable-next-line shadcn/no-restyle -- toolbar counters share one compact shape
          className="gap-1.5 px-2.5 disabled:opacity-100"
          onClick={() => setExact(true)}
        >
          <HugeiconsIcon
            icon={HashtagIcon}
            strokeWidth={2}
            className="text-muted-foreground/60"
          />
          <span
            className={cn(
              'text-2xs font-normal tabular-nums',
              canRequestExact &&
                'decoration-muted-foreground/50 underline decoration-dotted underline-offset-2'
            )}
          >
            {failed && <span className="text-muted-foreground">–</span>}
            {!failed && total && (
              <NumberFlow
                value={total.count}
                format={COMPACT_COUNT_FORMAT}
                className={cn(
                  'tabular-nums',
                  isFetching && 'text-muted-foreground/50 animate-pulse'
                )}
                prefix={total.isEstimated ? '~' : ''}
              />
            )}
            {!failed && !total && (
              <Skeleton className="h-2.5 w-6 rounded-full" />
            )}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {failed && 'No row count — the query failed.'}
        {!failed && total && (
          <div className="flex flex-col gap-0.5">
            <span>
              {total.isEstimated ? '~' : ''}
              {total.count.toLocaleString()} row{total.count === 1 ? '' : 's'}
              {canRequestExact && '. Click to get the exact count.'}
            </span>
            <span className="opacity-70">
              Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          </div>
        )}
        {!failed && !total && 'Counting rows…'}
      </TooltipContent>
    </Tooltip>
  )
}

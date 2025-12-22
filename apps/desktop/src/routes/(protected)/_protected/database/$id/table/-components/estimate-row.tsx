import NumberFlow from '@number-flow/react'
import { RiCheckLine, RiHistoryLine, RiRefreshLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { totalQuery } from '~/entities/database'
import { Route } from '../index'

interface TableRowCounterProps {
  schema: string
  table: string
  total?: number
  isEstimated?: boolean
  isLoading?: boolean
}

export function TableRowCounter({
  schema,
  table,
  total,
  isEstimated: initialIsEstimated,
  isLoading: initialLoading,
}: TableRowCounterProps) {
  const { database } = Route.useLoaderData()
  const [forceExact, setForceExact] = useState(false)

  const { data, isLoading: queryLoading, isFetching } = useQuery({
    queryKey: ['totalCount', database?.id, schema, table, forceExact],
    queryFn: async () => {
      return await totalQuery.run(database, {
        schema,
        table,
        enforceExactCount: forceExact,
      })
    },
    initialData: (total !== undefined)
      ? { count: total, isEstimated: !!initialIsEstimated }
      : undefined,
    enabled: !!database?.id && !!table,
    staleTime: forceExact ? 0 : 1000 * 60 * 5,
  })

  const handleToggleMode = () => setForceExact(prev => !prev)

  const activeLoading = initialLoading || (queryLoading && !data)

  if (activeLoading)
    return <span className="animate-pulse opacity-50 text-[11px]">...</span>

  if (!data || data.count === undefined)
    return null

  return (
    <div className="flex items-center gap-1 text-[11px] font-medium">
      <NumberFlow
        value={data.count}
        format={{
          notation: forceExact ? 'standard' : 'compact',
          compactDisplay: 'short',
          maximumFractionDigits: forceExact ? 0 : 1,
        }}
        className="text-zinc-100 font-semibold"
      />
      <span className="text-muted-foreground mr-1">records</span>

      <div className="flex items-center gap-1">
        {data.isEstimated && !forceExact
          ? (
              <span className="text-muted-foreground opacity-60 font-normal">(estimated)</span>
            )
          : (
              <span title="Exact count verified">
                <RiCheckLine className="size-3 text-green-500/60" />
              </span>
            )}

        <button
          type="button"
          onClick={handleToggleMode}
          disabled={isFetching}
          className="p-0.5 hover:bg-white/5 rounded-sm transition-colors group"
        >
          {forceExact
            ? (
                <RiHistoryLine className="size-3 text-blue-400/70" />
              )
            : (
                <RiRefreshLine
                  className={`size-3 text-muted-foreground opacity-40 group-hover:opacity-100 ${
                    isFetching ? 'animate-spin' : ''
                  }`}
                />
              )}
        </button>
      </div>
    </div>
  )
}

import type { ActiveFilter, Filter } from '@conar/shared/filters'
import NumberFlow from '@number-flow/react'
import { useQuery } from '@tanstack/react-query'
import { totalQuery } from '~/entities/database'
import { Route } from '../index'

interface TableRowCounterProps {
  schema: string
  table: string
  filters?: ActiveFilter<Filter>[]
}

export function TableRowCounter({ schema, table, filters = [] }: TableRowCounterProps) {
  const { database } = Route.useLoaderData()

  const { data, isLoading } = useQuery<{ count: number, isEstimated: boolean }>({
    queryKey: [
      'database',
      database.id,
      'schema',
      schema,
      'table',
      table,
      'total',
      { filters, enforceExactCount: false },
    ],
    queryFn: () =>
      totalQuery.run(database, {
        schema,
        table,
        filters,
        enforceExactCount: false,
      }) as Promise<{ count: number, isEstimated: boolean }>,
    enabled: Boolean(database?.id && table),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  if (isLoading || !data) {
    return <span className="animate-pulse opacity-50 text-[11px]">...</span>
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium">
      <NumberFlow
        value={data.count}
        format={{
          notation: 'compact',
          compactDisplay: 'short',
          maximumFractionDigits: 1,
        }}
        className="text-zinc-100 font-semibold tabular-nums"
      />
      <span className="text-muted-foreground">records</span>
      {data.isEstimated && (
        <span className="text-muted-foreground opacity-60 font-normal">
          (estimated)
        </span>
      )}
    </span>
  )
}

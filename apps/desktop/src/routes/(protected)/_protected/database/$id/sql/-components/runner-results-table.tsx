import type { ColumnRenderer } from '~/components/table'
import type { Column } from '~/entities/database/table'
import { Button } from '@conar/ui/components/button'
import { Input } from '@conar/ui/components/input'
import { useDebouncedMemo } from '@conar/ui/hookas/use-debounced-memo'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiCloseLine, RiSearchLine } from '@remixicon/react'
import { useMemo, useState } from 'react'
import { Table, TableBody, TableHeader, TableProvider } from '~/components/table'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/entities/database'
import { TableCell } from '~/entities/database/components/table-cell'

export function RunnerResultsTable({
  result,
  columns,
}: {
  result: Record<string, unknown>[]
  columns: Column[]
}) {
  const [search, setSearch] = useState('')

  const filteredData = useDebouncedMemo(() => {
    if (!search.trim())
      return result

    return result.filter(row =>
      JSON.stringify(Object.values(row)).toLowerCase().includes(search.toLowerCase()),
    )
  }, [result, search], 100)

  const tableColumns = useMemo(() => {
    return columns.map(column => ({
      id: column.name,
      header: ({ columnIndex, style }) => (
        <div
          className={cn(
            'flex w-full items-center justify-between shrink-0 p-2',
            columnIndex === 0 && 'pl-4',
          )}
          style={style}
        >
          <div className="text-xs">
            <div
              data-mask
              className="truncate font-medium flex items-center gap-1"
              title={column.name}
            >
              {column.name}
            </div>
          </div>
        </div>
      ),
      cell: props => <TableCell column={column} {...props} />,
      size: DEFAULT_COLUMN_WIDTH,
    } satisfies ColumnRenderer))
  }, [columns, filteredData])

  return (
    <div className="h-full">
      <div className="px-4 h-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Results</span>
          <span className="text-xs text-muted-foreground">
            <NumberFlow value={filteredData.length} className="tabular-nums" />
            {' '}
            {filteredData.length === 1 ? 'row' : 'rows'}
            {search && filteredData.length !== result.length && ` (filtered from ${result.length})`}
          </span>
        </div>
        <div className="relative flex-1 max-w-60">
          <Input
            placeholder="Search results..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-8 h-8 text-sm"
          />
          <RiSearchLine className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
          {search && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              onClick={() => setSearch('')}
            >
              <RiCloseLine className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <TableProvider
        rows={filteredData}
        columns={tableColumns}
        estimatedRowSize={DEFAULT_ROW_HEIGHT}
        estimatedColumnSize={DEFAULT_COLUMN_WIDTH}
      >
        <Table className="h-[calc(100%-theme(spacing.10))]">
          <TableHeader />
          <TableBody data-mask />
        </Table>
      </TableProvider>
    </div>
  )
}

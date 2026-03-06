import type { ColumnRenderer } from '@conar/table'
import type { Column } from '~/entities/connection/components/table/utils'
import { Table, TableBody, TableHeader, TableProvider } from '@conar/table'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Input } from '@conar/ui/components/input'
import { Separator } from '@conar/ui/components/separator'
import { useDebouncedMemo } from '@conar/ui/hookas/use-debounced-memo'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiCloseLine, RiExportLine, RiSearchLine } from '@remixicon/react'
import { useMemo, useState } from 'react'
import { ExportData } from '~/components/export-data'
import { TableCell } from '~/entities/connection/components'
import { DEFAULT_COLUMN_WIDTH } from '~/entities/connection/components/table/utils'

export function RunnerResultsTable({
  data,
  columns,
  duration,
}: {
  data: Record<string, unknown>[]
  columns: Pick<Column, 'id'>[]
  duration: number
}) {
  const [search, setSearch] = useState('')

  const filteredData = useDebouncedMemo(() => {
    if (!search.trim())
      return data

    return data.filter(row =>
      JSON.stringify(Object.values(row)).toLowerCase().includes(search.toLowerCase()),
    )
  }, [data, search], 100)

  const tableColumns = useMemo(() => {
    return columns.map(column => ({
      id: column.id,
      header: ({ columnIndex, style }) => (
        <div
          className={cn(
            'flex w-full shrink-0 items-center justify-between p-2',
            columnIndex === 0 && 'pl-4',
          )}
          style={style}
        >
          <div className="text-xs">
            <div
              data-mask
              className="flex items-center gap-1 truncate font-medium"
              title={column.id}
            >
              {column.id}
            </div>
          </div>
        </div>
      ),
      cell: props => (
        <TableCell
          column={{ id: column.id, type: 'text' }}
          {...props}
        />
      ),
      size: DEFAULT_COLUMN_WIDTH,
    } satisfies ColumnRenderer))
  }, [columns])

  const getData = async ({ limit }: { limit?: number }) => {
    return limit ? filteredData.slice(0, limit) : filteredData
  }

  return (
    <div className="h-full">
      <div className="flex h-10 items-center justify-between gap-2 pr-1 pl-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Results</span>
          <span className="text-xs text-muted-foreground">
            <NumberFlow value={filteredData.length} className="tabular-nums" />
            {' '}
            {filteredData.length === 1 ? 'row' : 'rows'}
            {search && filteredData.length !== data.length && ` (filtered from ${data.length})`}
          </span>
          <Separator orientation="vertical" className="h-4!" />
          <span className="text-xs text-muted-foreground">
            {duration.toFixed()}
            ms
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative max-w-60 flex-1">
            <Input
              placeholder="Search results..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-full pr-8 pl-7 text-sm"
            />
            <RiSearchLine className={`
              absolute top-1/2 left-2 size-3.5 -translate-y-1/2
              text-muted-foreground
            `}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-1.5 -translate-y-1/2"
                onClick={() => setSearch('')}
              >
                <RiCloseLine className="size-4" />
              </Button>
            )}
          </div>
          <Separator orientation="vertical" className="h-6!" />
          <ExportData
            getData={getData}
            filename="runner_results"
            trigger={({ isExporting }) => (
              <Button
                variant="outline"
                size="icon-sm"
                disabled={isExporting || filteredData.length === 0}
              >
                <LoadingContent loading={isExporting}>
                  <RiExportLine />
                </LoadingContent>
              </Button>
            )}
          />
        </div>
      </div>
      <TableProvider
        rows={filteredData}
        columns={tableColumns}
      >
        <Table className="h-[calc(100%-(--spacing(10)))]">
          <TableHeader />
          <TableBody data-mask />
        </Table>
      </TableProvider>
    </div>
  )
}

import { RiCloseLine, RiExportLine, RiSearchLine } from '@remixicon/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ColumnRenderer } from '@tamery/table'
import { Table, TableBody, TableHeader, TableProvider } from '@tamery/table'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { Input } from '@tamery/ui/components/input'
import { Separator } from '@tamery/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useDebouncedMemo } from '@tamery/ui/hookas/use-debounced-memo'
import { cn } from '@tamery/ui/lib/utils'
import { useState } from 'react'

import type { ExportDataProps } from '~/components/export-data'
import { ExportData } from '~/components/export-data'
import { TableCell } from '~/entities/connection/components/table/cell'
import type { Column } from '~/entities/connection/components/table/cell'

const ResultColumnHeader = ({
  columnId,
  columnIndex,
  style,
}: {
  columnId: string
  columnIndex: number
  style?: React.CSSProperties
}) => (
  <div
    className={cn(
      'flex w-full shrink-0 items-center justify-between p-2',
      columnIndex === 0 && 'pl-4'
    )}
    style={style}
  >
    <div className="text-xs">
      <div
        data-mask
        className="flex items-center gap-1 truncate font-medium"
        title={columnId}
      >
        {columnId}
      </div>
    </div>
  </div>
)

const ResultColumnCell = ({
  columnId,
  connectionType,
  ...props
}: {
  columnId: string
  connectionType: ConnectionType
} & Omit<
  React.ComponentProps<typeof TableCell>,
  'column' | 'connectionType'
>) => (
  <TableCell
    {...props}
    column={{ id: columnId, uiType: 'raw' }}
    connectionType={connectionType}
  />
)

const createResultColumn = (
  column: Pick<Column, 'id'>,
  connectionType: ConnectionType
): ColumnRenderer => ({
  cell: (props) => (
    <ResultColumnCell
      columnId={column.id}
      connectionType={connectionType}
      {...props}
    />
  ),
  header: ({ columnIndex, style }) => (
    <ResultColumnHeader
      columnId={column.id}
      columnIndex={columnIndex}
      style={style}
    />
  ),
  id: column.id,
  size: DEFAULT_COLUMN_WIDTH,
})

const ResultsExport = ({
  getData,
  disabled,
}: {
  getData: ExportDataProps['getData']
  disabled: boolean
}) => (
  <ExportData
    getData={getData}
    filename="runner_results"
    tooltip="Export results"
    // oxlint-disable-next-line react/no-unstable-nested-components
    trigger={({ isExporting }) => (
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Export results"
        disabled={isExporting || disabled}
      >
        <LoadingContent loading={isExporting}>
          <RiExportLine />
        </LoadingContent>
      </Button>
    )}
  />
)

export const RunnerResultsTable = ({
  data,
  columns,
  duration,
  connectionType,
}: {
  data: Record<string, unknown>[]
  columns: Pick<Column, 'id'>[]
  duration: number
  connectionType: ConnectionType
}) => {
  const [search, setSearch] = useState('')

  const filteredData = useDebouncedMemo(
    () => {
      if (!search.trim()) {
        return data
      }

      return data.filter((row) =>
        JSON.stringify(Object.values(row))
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    },
    [data, search],
    100
  )

  const tableColumns = columns.map((column) =>
    createResultColumn(column, connectionType)
  )

  const getData: ExportDataProps['getData'] = ({ limit }) =>
    Promise.resolve(limit ? filteredData.slice(0, limit) : filteredData)

  const isEmpty = filteredData.length === 0

  return (
    <div className="h-full">
      <div className="flex h-10 items-center justify-between gap-2 pr-1 pl-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Results</span>
          <span className="text-muted-foreground text-xs">
            <NumberFlow value={filteredData.length} className="tabular-nums" />{' '}
            {filteredData.length === 1 ? 'row' : 'rows'}
            {search &&
              filteredData.length !== data.length &&
              ` (filtered from ${data.length})`}
          </span>
          <Separator orientation="vertical" className="h-4!" />
          <span className="text-muted-foreground text-xs">
            {duration.toFixed(0)}
            ms
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative max-w-60 flex-1">
            <Input
              placeholder="Search results..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full pr-8 pl-7 text-sm"
            />
            <RiSearchLine className="text-muted-foreground absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
            {search && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Clear search"
                      className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground absolute inset-y-0 right-1.5 my-auto"
                      onClick={() => setSearch('')}
                    />
                  }
                >
                  <RiCloseLine className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="top">Clear</TooltipContent>
              </Tooltip>
            )}
          </div>
          <Separator orientation="vertical" className="h-6!" />
          <ResultsExport getData={getData} disabled={isEmpty} />
        </div>
      </div>
      <TableProvider rows={filteredData} columns={tableColumns}>
        <Table className="h-[calc(100%-(--spacing(10)))]">
          <TableHeader />
          <TableBody data-mask />
        </Table>
      </TableProvider>
    </div>
  )
}

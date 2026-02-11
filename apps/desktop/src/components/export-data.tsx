import type { ActiveFilter } from '@conar/shared/filters'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { downloadFile, escapeCSVValue } from '@conar/shared/utils/files'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@conar/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { RiBracesLine, RiDownloadLine, RiFileCopyLine, RiTableLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { handleError } from '~/lib/error'

const EXPORT_LIMITS = [50, 100, 500, 1000, 5000] as const

type ContentGeneratorType = 'download' | 'copy'
type ContentFormatType = 'csv' | 'json'

function exportData({
  type,
  data,
  format,
  filename,
}: {
  type: ContentGeneratorType
  data: Record<string, unknown>[]
  format: ContentFormatType
  filename: string
}) {
  const generators = {
    csv: () => {
      if (data[0] === undefined) {
        return
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => escapeCSVValue(row[header])).join(','),
        ),
      ]
      const content = csvRows.join('\n')

      if (type === 'download') {
        downloadFile(content, `${filename}.csv`, 'text/csv;charset=utf-8;')
      }

      if (type === 'copy') {
        copy(content, `Copied ${data.length} rows to clipboard as CSV`)
      }
    },
    json: () => {
      const content = JSON.stringify(data, null, 2)

      if (type === 'download') {
        downloadFile(content, `${filename}.json`, 'application/json')
      }

      if (type === 'copy') {
        copy(content, `Copied ${data.length} rows to clipboard as JSON`)
      }
    },
  } satisfies Record<ContentFormatType, () => void>

  return generators[format]
}

interface ExportProps {
  type: ContentGeneratorType
  format: ContentFormatType
  limit?: (typeof EXPORT_LIMITS)[number]
  selectedFilters?: ActiveFilter[]
}

function ExportDataDropdownMenuSubContent({
  format,
  type,
  onExport,
  rowsCount,
  selected,
}: {
  format: ContentFormatType
  type: ContentGeneratorType
  onExport: (props: ExportProps) => void
  rowsCount: number
  selected?: Record<string, unknown>[]
}) {
  const selectedFilters = selected?.flatMap(row => Object.entries(row).map(([column, value]) => ({
    column,
    ref: SQL_FILTERS_LIST.find(filter => filter.operator === '=')!,
    values: [value],
  } satisfies ActiveFilter)))

  const limits = EXPORT_LIMITS.map(limit => ({
    limit,
    disabled: EXPORT_LIMITS.findIndex(l => l === limit) > EXPORT_LIMITS.findIndex(l => l <= rowsCount) + 1,
  }))

  return (
    <DropdownMenuSubContent>
      {!!selected && (
        <>
          <DropdownMenuItem
            disabled={selected.length === 0}
            onClick={() => onExport({ type, format, selectedFilters })}
          >
            {selected.length === 0
              ? 'Selected rows'
              : selected.length === 1
                ? '1 selected row'
                : `${selected.length} selected rows`}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      {limits.map(({ limit, disabled }) => (
        <DropdownMenuItem
          key={limit}
          onClick={() => onExport({ type, format, limit })}
          disabled={disabled}
        >
          First
          {' '}
          {limit}
          {' '}
          rows
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onExport({ type, format })}>
        All rows
      </DropdownMenuItem>
    </DropdownMenuSubContent>
  )
}

export function ExportData({
  filename = 'export',
  getData,
  rowsCount,
  trigger,
  selected,
}: {
  filename?: string
  getData: ({ limit, selectedFilters }: { limit?: (typeof EXPORT_LIMITS)[number], selectedFilters?: ActiveFilter[] }) => Promise<Record<string, unknown>[]>
  rowsCount: number
  trigger: (props: { isExporting: boolean }) => React.ReactNode
  selected?: Record<string, unknown>[]
}) {
  const { mutate: startExport, isPending } = useMutation({
    mutationFn: async ({
      type,
      format,
      selectedFilters,
      limit,
    }: ExportProps) => {
      const data = await getData({ limit, selectedFilters })

      exportData({ type, data, format, filename: `${filename}_${limit}` })()
    },
    onError: handleError,
  })

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              {trigger({ isExporting: isPending })}
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RiDownloadLine />
                Export
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RiTableLine />
                    Export as CSV
                  </DropdownMenuSubTrigger>
                  <ExportDataDropdownMenuSubContent
                    type="download"
                    format="csv"
                    onExport={startExport}
                    rowsCount={rowsCount}
                    selected={selected}
                  />
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RiBracesLine />
                    Export as JSON
                  </DropdownMenuSubTrigger>
                  <ExportDataDropdownMenuSubContent
                    type="download"
                    format="json"
                    onExport={startExport}
                    rowsCount={rowsCount}
                    selected={selected}
                  />
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RiFileCopyLine />
                Copy
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RiTableLine />
                    Copy as CSV
                  </DropdownMenuSubTrigger>
                  <ExportDataDropdownMenuSubContent
                    type="copy"
                    format="csv"
                    onExport={startExport}
                    rowsCount={rowsCount}
                    selected={selected}
                  />
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RiBracesLine />
                    Copy as JSON
                  </DropdownMenuSubTrigger>
                  <ExportDataDropdownMenuSubContent
                    type="copy"
                    format="json"
                    onExport={startExport}
                    rowsCount={rowsCount}
                    selected={selected}
                  />
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>
          Export data
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

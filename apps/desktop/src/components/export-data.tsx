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

function contentGenerators(data: Record<string, unknown>[]) {
  return {
    csv: () => {
      if (data[0] === undefined) {
        return ''
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => escapeCSVValue(row[header])).join(','),
        ),
      ]
      return csvRows.join('\n')
    },
    json: () => JSON.stringify(data, null, 2),
  } satisfies Record<string, () => string>
}

const mimeTypes = {
  csv: 'text/csv;charset=utf-8;',
  json: 'application/json',
}

const EXPORT_LIMITS = [50, 100, 500, 1000, 5000] as const

interface ExportProps {
  format: keyof ReturnType<typeof contentGenerators>
  limit?: (typeof EXPORT_LIMITS)[number]
  selectedFilters?: ActiveFilter[]
}

function ExportDataDropdownMenuSubContent({
  format,
  onExport,
  rowsCount,
  selected,
}: {
  format: keyof ReturnType<typeof contentGenerators>
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
            onClick={() => onExport({ format, selectedFilters })}
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
          onClick={() => onExport({ format, limit })}
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
      <DropdownMenuItem onClick={() => onExport({ format })}>
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
  const { mutate: exportData, isPending: isExporting } = useMutation({
    mutationFn: async ({
      format,
      selectedFilters,
      limit,
    }: ExportProps) => {
      const data = await getData({ limit, selectedFilters })

      const content = contentGenerators(data)[format]()
      const fileName = `${filename}.${format}`
      const mimeType = mimeTypes[format]

      return { content, fileName, mimeType }
    },
    onSuccess: ({ content, fileName, mimeType }) => {
      downloadFile(content, fileName, mimeType)
    },
    onError: handleError,
  })

  const { mutate: copyToClipboard, isPending: isCopying } = useMutation({
    mutationFn: async ({
      format,
      limit,
      selectedFilters,
    }: ExportProps) => {
      const data = await getData({ limit, selectedFilters })
      const content = contentGenerators(data)[format]()
      return { content, count: data.length, format }
    },
    onSuccess: ({ content, count, format }) => {
      copy(content, `Copied ${count} ${count === 1 ? 'row' : 'rows'} to clipboard as ${format}`)
    },
    onError: handleError,
  })

  const isPending = isExporting || isCopying

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
                  <ExportDataDropdownMenuSubContent format="csv" onExport={exportData} rowsCount={rowsCount} selected={selected} />
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RiBracesLine />
                    Export as JSON
                  </DropdownMenuSubTrigger>
                  <ExportDataDropdownMenuSubContent format="json" onExport={exportData} rowsCount={rowsCount} selected={selected} />
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
                  <ExportDataDropdownMenuSubContent format="csv" onExport={copyToClipboard} rowsCount={rowsCount} selected={selected} />
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RiBracesLine />
                    Copy as JSON
                  </DropdownMenuSubTrigger>
                  <ExportDataDropdownMenuSubContent format="json" onExport={copyToClipboard} rowsCount={rowsCount} selected={selected} />
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

import {
  RiBracesLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiMarkdownLine,
  RiTableLine,
} from '@remixicon/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { SQL_FILTERS_LIST } from '@tamery/shared/filters'
import { downloadFile, recordsToMarkdownTable, toCSV } from '@tamery/shared/utils/files'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { copy } from '@tamery/ui/lib/copy'
import { useMutation } from '@tanstack/react-query'
import { formatDate } from 'date-fns'
import { toast } from 'sonner'

import { handleError } from '~/utils/error'

const EXPORT_LIMITS = [50, 100, 500, 1000, 5000] as const
const EXPORT_TOAST_ID = 'export-data'

type ContentGeneratorType = 'download' | 'copy'
type ContentFormatType = 'csv' | 'json' | 'markdown'

function generateContent({
  data,
  format,
}: {
  data: Record<string, unknown>[]
  format: ContentFormatType
}) {
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  if (data[0] === undefined) {
    return null
  }

  const columns = Object.keys(data[0]).map(key => ({ key }))

  return format === 'csv' ? toCSV(columns, data) : recordsToMarkdownTable(columns, data)
}

const FILE_META = {
  csv: { extension: 'csv', mime: 'text/csv;charset=utf-8;' },
  json: { extension: 'json', mime: 'application/json' },
  markdown: { extension: 'md', mime: 'text/markdown;charset=utf-8;' },
} satisfies Record<ContentFormatType, { extension: string; mime: string }>

interface ExportProps {
  type: ContentGeneratorType
  format: ContentFormatType
  limit?: (typeof EXPORT_LIMITS)[number]
  filters?: ActiveFilter[]
}

function ExportDataDropdownMenuSubContent({
  format,
  type,
  onExport,
  selected,
}: {
  format: ContentFormatType
  type: ContentGeneratorType
  onExport: (props: ExportProps) => void
  selected?: Record<string, unknown>[]
}) {
  const filters = selected?.flatMap(row =>
    Object.entries(row).map(
      ([column, value]) =>
        ({
          column,
          ref: SQL_FILTERS_LIST.find(filter => filter.operator === '=')!,
          values: [value],
        }) satisfies ActiveFilter,
    ),
  )

  return (
    <DropdownMenuSubContent>
      {!!selected && (
        <>
          <DropdownMenuItem
            disabled={selected.length === 0}
            onClick={() => onExport({ type, format, filters })}
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
      {EXPORT_LIMITS.map(limit => (
        <DropdownMenuItem key={limit} onClick={() => onExport({ type, format, limit })}>
          First {limit} rows
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onExport({ type, format })}>All rows</DropdownMenuItem>
    </DropdownMenuSubContent>
  )
}

function useExportMutation({
  filename,
  getData,
}: {
  filename: string
  getData: ExportDataProps['getData']
}) {
  return useMutation({
    mutationFn: async ({ type, format, filters, limit }: ExportProps) => {
      const data = await getData({ limit, filters })
      const content = generateContent({ data, format })

      if (content === null) {
        return { count: 0, type, format }
      }

      if (type === 'download') {
        const { extension, mime } = FILE_META[format]
        const stamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss')
        downloadFile(content, `${filename}${limit ? `_${limit}` : ''}_${stamp}.${extension}`, mime)
      } else {
        copy(content)
      }

      return { count: data.length, type, format }
    },
    onMutate: () => {
      toast.loading('Preparing data…', { id: EXPORT_TOAST_ID })
    },
    onSuccess: ({ count, type, format }) => {
      if (count === 0) {
        toast.info('Nothing to export — no rows matched', { id: EXPORT_TOAST_ID })
        return
      }

      const label = format === 'markdown' ? 'Markdown' : format.toUpperCase()
      toast.success(
        type === 'download'
          ? `Downloaded ${count} row${count === 1 ? '' : 's'} as ${label}`
          : `Copied ${count} row${count === 1 ? '' : 's'} as ${label}`,
        { id: EXPORT_TOAST_ID },
      )
    },
    onError: error => {
      toast.dismiss(EXPORT_TOAST_ID)
      handleError(error)
    },
  })
}

const FORMAT_ITEMS = [
  { format: 'csv', label: 'CSV', icon: RiTableLine },
  { format: 'json', label: 'JSON', icon: RiBracesLine },
  { format: 'markdown', label: 'Markdown', icon: RiMarkdownLine },
] satisfies { format: ContentFormatType; label: string; icon: typeof RiTableLine }[]

interface ExportDataProps {
  filename: string
  getData: ({
    limit,
    filters,
  }: {
    limit?: (typeof EXPORT_LIMITS)[number]
    filters?: ActiveFilter[]
  }) => Promise<Record<string, unknown>[]>
  selected?: Record<string, unknown>[]
  disabled?: boolean
}

function ExportItems({
  onExport,
  selected,
  disabled,
}: {
  onExport: (props: ExportProps) => void
  selected?: Record<string, unknown>[]
  disabled?: boolean
}) {
  return (
    <>
      {(['download', 'copy'] as const).map(type => (
        <DropdownMenuSub key={type}>
          <DropdownMenuSubTrigger disabled={disabled}>
            {type === 'download' ? <RiDownloadLine /> : <RiFileCopyLine />}
            {type === 'download' ? 'Export' : 'Copy'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {FORMAT_ITEMS.map(({ format, label, icon: Icon }) => (
              <DropdownMenuSub key={format}>
                <DropdownMenuSubTrigger>
                  <Icon />
                  {type === 'download' ? 'Export' : 'Copy'} as {label}
                </DropdownMenuSubTrigger>
                <ExportDataDropdownMenuSubContent
                  type={type}
                  format={format}
                  onExport={onExport}
                  selected={selected}
                />
              </DropdownMenuSub>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      ))}
    </>
  )
}

// Submenu blocks for embedding inside an existing DropdownMenuContent
export function ExportDataMenu({ filename, getData, selected, disabled }: ExportDataProps) {
  const { mutate } = useExportMutation({ filename, getData })

  return <ExportItems onExport={mutate} selected={selected} disabled={disabled} />
}

export function ExportData({
  filename,
  getData,
  trigger,
  tooltip,
  selected,
}: ExportDataProps & {
  trigger: (props: { isExporting: boolean }) => React.ReactElement
  tooltip?: string
}) {
  const { mutate, isPending } = useExportMutation({ filename, getData })

  return (
    <DropdownMenu>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger
            render={<DropdownMenuTrigger render={trigger({ isExporting: isPending })} />}
          />
          <TooltipContent side="top">{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger render={trigger({ isExporting: isPending })} />
      )}
      <DropdownMenuContent align="end">
        <ExportItems onExport={mutate} selected={selected} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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

const EXPORT_LIMITS = [50, 100, 500, 1000] as const

export interface JsonCopyAction {
  id: string
  label: string
  disabled?: boolean
  getContent: () => Promise<{
    content: string
    message?: string
  }>
}

export function ExportData({
  filename = 'export',
  getData,
  copyJsonActions,
  trigger,
}: {
  filename?: string
  getData: (limit?: (typeof EXPORT_LIMITS)[number]) => Promise<Record<string, unknown>[]>
  copyJsonActions?: JsonCopyAction[]
  trigger: (props: { isExporting: boolean }) => React.ReactNode
}) {
  const { mutate: exportData, isPending: isExporting } = useMutation({
    mutationFn: async ({
      format,
      limit,
    }: {
      format: keyof ReturnType<typeof contentGenerators>
      limit?: (typeof EXPORT_LIMITS)[number]
    }) => {
      const data = await getData(limit)

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
    }: {
      format: keyof ReturnType<typeof contentGenerators>
      limit?: (typeof EXPORT_LIMITS)[number]
    }) => {
      const data = await getData(limit)
      const content = contentGenerators(data)[format]()
      return { content, count: data.length, format }
    },
    onSuccess: ({ content, count, format }) => {
      copy(content, `Copied ${count} ${count === 1 ? 'row' : 'rows'} to clipboard as ${format}`)
    },
    onError: handleError,
  })

  const { mutate: copyCustomJsonToClipboard, isPending: isCopyingCustomJson } = useMutation({
    mutationFn: async (action: JsonCopyAction) => action.getContent(),
    onSuccess: ({ content, message }) => {
      copy(content, message ?? 'JSON copied to clipboard')
    },
    onError: handleError,
  })

  const isPending = isExporting || isCopying || isCopyingCustomJson

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
                  <DropdownMenuSubContent>
                    {EXPORT_LIMITS.map(limitOption => (
                      <DropdownMenuItem
                        key={limitOption}
                        onClick={() => exportData({ format: 'csv', limit: limitOption })}
                      >
                        First
                        {' '}
                        {limitOption}
                        {' '}
                        rows
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={() => exportData({ format: 'csv' })}>
                      All rows
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RiBracesLine />
                    Export as JSON
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {EXPORT_LIMITS.map(limitOption => (
                      <DropdownMenuItem
                        key={limitOption}
                        onClick={() => exportData({ format: 'json', limit: limitOption })}
                      >
                        First
                        {' '}
                        {limitOption}
                        {' '}
                        rows
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={() => exportData({ format: 'json' })}>
                      All rows
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
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
                  <DropdownMenuSubContent>
                    {EXPORT_LIMITS.map(limitOption => (
                      <DropdownMenuItem
                        key={limitOption}
                        onClick={() => copyToClipboard({ format: 'csv', limit: limitOption })}
                      >
                        First
                        {' '}
                        {limitOption}
                        {' '}
                        rows
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={() => copyToClipboard({ format: 'csv' })}>
                      All rows
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RiBracesLine />
                    Copy as JSON
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {EXPORT_LIMITS.map(limitOption => (
                      <DropdownMenuItem
                        key={limitOption}
                        onClick={() => copyToClipboard({ format: 'json', limit: limitOption })}
                      >
                        First
                        {' '}
                        {limitOption}
                        {' '}
                        rows
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={() => copyToClipboard({ format: 'json' })}>
                      All rows
                    </DropdownMenuItem>
                    {copyJsonActions && copyJsonActions.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        {copyJsonActions.map(action => (
                          <DropdownMenuItem
                            key={action.id}
                            disabled={action.disabled}
                            onClick={() => copyCustomJsonToClipboard(action)}
                          >
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuSubContent>
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

import { downloadFile, escapeCSVValue } from '@conar/shared/utils/files'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { RiBracesLine, RiTableLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'

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

export function ExportData({
  filename = 'export',
  getData,
  trigger,
}: {
  filename?: string
  getData: (limit?: (typeof EXPORT_LIMITS)[number]) => Promise<Record<string, unknown>[]>
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
  })

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              {trigger({ isExporting })}
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={isExporting}>
                <RiTableLine />
                Export as CSV
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {EXPORT_LIMITS.map(limitOption => (
                  <DropdownMenuItem
                    key={limitOption}
                    onClick={() => exportData({ format: 'csv', limit: limitOption })}
                    disabled={isExporting}
                  >
                    {`First ${limitOption} rows`}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={() => exportData({ format: 'csv' })}
                  disabled={isExporting}
                >
                  All rows
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={isExporting}>
                <RiBracesLine />
                Export as JSON
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {EXPORT_LIMITS.map(limitOption => (
                  <DropdownMenuItem
                    key={limitOption}
                    onClick={() => exportData({ format: 'json', limit: limitOption })}
                    disabled={isExporting}
                  >
                    {`First ${limitOption} rows`}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={() => exportData({ format: 'json' })}
                  disabled={isExporting}
                >
                  All rows
                </DropdownMenuItem>
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

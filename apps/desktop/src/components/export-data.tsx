import { Button } from '@conar/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@conar/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@conar/ui/components/tooltip'
import { RiBracesLine, RiExportLine, RiLoader4Fill, RiTableLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'

interface ExportDataProps {
  data: Record<string, unknown>[]
  filename?: string
  fetchAllData?: () => Promise<Record<string, unknown>[]>
}

type ExportFormat = 'csv' | 'json'

export function ExportData({ data, filename = 'export', fetchAllData }: ExportDataProps) {
  const isEmpty = !data.length

  const escapeCSVValue = useCallback((value: unknown): string => {
    if (value === null || value === undefined)
      return ''

    const stringValue = String(value)

    // Wrap in quotes if contains comma, newline, or quote
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
  }, [])

  const downloadFile = useCallback((content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    try {
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    finally {
      URL.revokeObjectURL(url)
    }
  }, [])

  const exportMutation = useMutation({
    mutationFn: async (format: ExportFormat) => {
      const exportData = fetchAllData ? await fetchAllData() : data

      const contentGenerators = {
        csv: () => {
          const headers = Object.keys(exportData[0]!)
          const csvRows = [
            headers.join(','),
            ...exportData.map(row =>
              headers.map(header => escapeCSVValue(row[header])).join(','),
            ),
          ]
          return csvRows.join('\n')
        },
        json: () => JSON.stringify(exportData, null, 2),
      }

      const mimeTypes = {
        csv: 'text/csv;charset=utf-8;',
        json: 'application/json',
      }

      const content = contentGenerators[format]()
      const fileName = `${filename}.${format}`
      const mimeType = mimeTypes[format]

      return { content, fileName, mimeType }
    },
    onSuccess: ({ content, fileName, mimeType }) => {
      downloadFile(content, fileName, mimeType)
    },
  })

  const handleExport = useCallback((format: ExportFormat) => {
    if (isEmpty)
      return
    exportMutation.mutate(format)
  }, [isEmpty, exportMutation])

  const isExporting = exportMutation.isPending

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={isEmpty || isExporting}
                aria-label="Export data"
              >
                {isExporting
                  ? (
                      <RiLoader4Fill className="animate-spin" aria-hidden="true" />
                    )
                  : (
                      <RiExportLine aria-hidden="true" />
                    )}
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleExport('csv')}
              className="cursor-pointer"
              disabled={isExporting}
            >
              <RiTableLine aria-hidden="true" />
              {isExporting ? 'Exporting...' : 'Export as CSV'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport('json')}
              className="cursor-pointer"
              disabled={isExporting}
            >
              <RiBracesLine aria-hidden="true" />
              {isExporting ? 'Exporting...' : 'Export as JSON'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent side="top" align="end">
          {isExporting ? 'Exporting data...' : 'Export data'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

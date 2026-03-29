export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

export function downloadFile(content: string, fileName: string, mimeType: string) {
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
    link.remove()
  }
  finally {
    URL.revokeObjectURL(url)
  }
}

const csvValueRegex = /"/g

function escapeCSVValue(value: unknown) {
  if (value === null || value === undefined)
    return ''

  const stringValue = String(value)

  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(csvValueRegex, '""')}"`
  }

  return stringValue
}

export function toCSV<T extends Record<string, unknown>>(headers: (keyof T)[], data: T[]) {
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => escapeCSVValue(row[header])).join(','),
    ),
  ]
  return csvRows.join('\n')
}

/** JSON.stringify replacer so clipboard/export survives `bigint` fields. */
export function jsonReplacerForClipboard(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value
}

/** Single-cell plain representation: objects as compact JSON, scalars as strings. */
export function formatValueForPlainCell(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  if (typeof value === 'object')
    return JSON.stringify(value, jsonReplacerForClipboard)
  return String(value)
}

export function rowValuesToPlainText(
  row: Record<string, unknown>,
  columnKeys: string[],
  separator: '\t' | '\n' = '\t',
): string {
  return columnKeys.map(key => formatValueForPlainCell(row[key])).join(separator)
}

export function recordToPrettyJson(row: Record<string, unknown>): string {
  return JSON.stringify(row, jsonReplacerForClipboard, 2)
}

export interface TabularColumnSpec { key: string, header?: string }

/** One CSV header row (labels) plus data rows; values are read by `key`. */
export function recordsToCSV(columns: TabularColumnSpec[], data: Record<string, unknown>[]): string {
  const keys = columns.map(c => c.key)
  const headerRow = columns.map(c => escapeCSVValue(c.header ?? c.key)).join(',')
  const dataRows = data.map(row =>
    keys.map(key => escapeCSVValue(row[key])).join(','),
  )
  return [headerRow, ...dataRows].join('\n')
}

function escapeMarkdownTableCell(raw: string): string {
  return raw
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replaceAll('\r\n', ' ')
    .replaceAll('\n', ' ')
    .replaceAll('\r', ' ')
    .trim()
}

/** GitHub-style markdown pipe table for a single row. */
export function recordToMarkdownTable(
  row: Record<string, unknown>,
  columns: TabularColumnSpec[],
): string {
  const keys = columns.map(c => c.key)
  const headers = columns.map(c => escapeMarkdownTableCell(String(c.header ?? c.key)))
  const values = keys.map(key => escapeMarkdownTableCell(formatValueForPlainCell(row[key])))
  const rule = keys.map(() => '---').join(' | ')
  return [
    `| ${headers.join(' | ')} |`,
    `| ${rule} |`,
    `| ${values.join(' | ')} |`,
  ].join('\n')
}

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
  }
  finally {
    URL.revokeObjectURL(url)
  }
}

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined)
    return ''

  const str = String(value)

  return str.includes(',') || str.includes('\n') || str.includes('"')
    ? `"${str.replaceAll('"', '""')}"`
    : str
}

export function formatValueForPlainCell(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  if (typeof value === 'object')
    return JSON.stringify(value)
  return String(value)
}

export function toCSV(columns: {
  key: string
  header?: string
}[], data: Record<string, unknown>[]): string {
  const headerRow = columns.map(c => escapeCSVValue(c.header ?? c.key)).join(',')
  const dataRows = data.map(row =>
    columns.map(c => escapeCSVValue(row[c.key])).join(','),
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

export function recordToMarkdownTable(
  row: Record<string, unknown>,
  columns: {
    key: string
    header?: string
  }[],
): string {
  const headers = columns.map(c => escapeMarkdownTableCell(String(c.header ?? c.key)))
  const values = columns.map(c => escapeMarkdownTableCell(formatValueForPlainCell(row[c.key])))
  const rule = columns.map(() => '---').join(' | ')
  return [
    `| ${headers.join(' | ')} |`,
    `| ${rule} |`,
    `| ${values.join(' | ')} |`,
  ].join('\n')
}

export function recordsToMarkdownTable(
  columns: {
    key: string
    header?: string
  }[],
  data: Record<string, unknown>[],
): string {
  const headers = columns.map(c => escapeMarkdownTableCell(String(c.header ?? c.key)))
  const rule = columns.map(() => '---').join(' | ')
  const rows = data.map(row =>
    `| ${columns.map(c => escapeMarkdownTableCell(formatValueForPlainCell(row[c.key]))).join(' | ')} |`,
  )
  return [
    `| ${headers.join(' | ')} |`,
    `| ${rule} |`,
    ...rows,
  ].join('\n')
}

export const downloadFile = (
  content: string,
  fileName: string,
  mimeType: string
) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  try {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'

    document.body.append(link)
    link.click()
    link.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

const escapeCSVValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  return str.includes(',') || str.includes('\n') || str.includes('"')
    ? `"${str.replaceAll('"', '""')}"`
    : str
}

export const formatValueForPlainCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

export const toCSV = (
  columns: {
    key: string
    header?: string
  }[],
  data: Record<string, unknown>[]
): string => {
  const headerRow = columns
    .map((c) => escapeCSVValue(c.header ?? c.key))
    .join(',')
  const dataRows = data.map((row) =>
    columns.map((c) => escapeCSVValue(row[c.key])).join(',')
  )
  return [headerRow, ...dataRows].join('\n')
}

const escapeMarkdownTableCell = (raw: string): string =>
  raw
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replaceAll('\r\n', ' ')
    .replaceAll('\n', ' ')
    .replaceAll('\r', ' ')
    .trim()

export const recordToMarkdownTable = (
  row: Record<string, unknown>,
  columns: {
    key: string
    header?: string
  }[]
): string => {
  const headers = columns.map((c) =>
    escapeMarkdownTableCell(String(c.header ?? c.key))
  )
  const values = columns.map((c) =>
    escapeMarkdownTableCell(formatValueForPlainCell(row[c.key]))
  )
  const rule = columns.map(() => '---').join(' | ')
  return [
    `| ${headers.join(' | ')} |`,
    `| ${rule} |`,
    `| ${values.join(' | ')} |`,
  ].join('\n')
}

export const recordsToMarkdownTable = (
  columns: {
    key: string
    header?: string
  }[],
  data: Record<string, unknown>[]
): string => {
  const headers = columns.map((c) =>
    escapeMarkdownTableCell(String(c.header ?? c.key))
  )
  const rule = columns.map(() => '---').join(' | ')
  const rows = data.map(
    (row) =>
      `| ${columns.map((c) => escapeMarkdownTableCell(formatValueForPlainCell(row[c.key]))).join(' | ')} |`
  )
  return [`| ${headers.join(' | ')} |`, `| ${rule} |`, ...rows].join('\n')
}

const sizeFormats = {
  kilobyte: new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
    style: 'unit',
    unit: 'kilobyte',
  }),
  megabyte: new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    style: 'unit',
    unit: 'megabyte',
  }),
}

export const fileSize = (bytes: number) =>
  bytes < 1_000_000
    ? sizeFormats.kilobyte.format(Math.max(1, bytes / 1000))
    : sizeFormats.megabyte.format(bytes / 1_000_000)

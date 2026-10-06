import { valueToText } from './value-text'

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

const escapeCSVValue = (value: unknown, delimiter = ','): string => {
  const str = valueToText(value)

  return str.includes(delimiter) ||
    str.includes('\n') ||
    str.includes('\r') ||
    str.includes('"')
    ? `"${str.replaceAll('"', '""')}"`
    : str
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

export const toTsv = (rows: string[][]) =>
  rows
    .map((row) => row.map((field) => escapeCSVValue(field, '\t')).join('\t'))
    .join('\n')

/** Reads what Sheets, Excel and Numbers put on the clipboard; one trailing newline is not a row. */
export const parseTsv = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let index = 0
  while (index < text.length) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index += 2
        continue
      }
      if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"' && field === '') {
      quoted = true
    } else if (char === '\t') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1
      }
    } else {
      field += char
    }
    index += 1
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
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
    escapeMarkdownTableCell(valueToText(row[c.key]))
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
      `| ${columns.map((c) => escapeMarkdownTableCell(valueToText(row[c.key]))).join(' | ')} |`
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

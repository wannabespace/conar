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

const NEEDS_QUOTES = /[\t\n\r"]/u

const quote = (field: string) =>
  NEEDS_QUOTES.test(field) ? `"${field.replaceAll('"', '""')}"` : field

export const toTsv = (rows: string[][]) =>
  rows.map((row) => row.map(quote).join('\t')).join('\n')

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

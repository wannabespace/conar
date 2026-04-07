export function getDisplayValue(value: unknown, size: number): string {
  let display: string

  if (value === null)
    display = 'null'
  else if (value === '')
    display = 'empty'
  else if (typeof value === 'object')
    display = JSON.stringify(value)
  else
    display = String(value)

  return display.replaceAll('\n', ' ').slice(0, (size / 6) + 5 + 50)
}

export function getValueForEditor(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  if (value instanceof Date)
    return value.toISOString()
  if (typeof value === 'string')
    return value
  return JSON.stringify(value, null, 2)
}

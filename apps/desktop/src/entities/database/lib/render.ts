export function getEditableValue(value: unknown, oneLine: boolean) {
  if (typeof value === 'object' && value !== null)
    return oneLine ? JSON.stringify(value).replaceAll('\n', ' ') : JSON.stringify(value)

  return oneLine ? String(value ?? '').replaceAll('\n', ' ') : String(value ?? '')
}

export function getDisplayValue(value: unknown, size: number) {
  if (value === null)
    return 'null'

  if (value === '')
    return 'empty'

  /*
    If value has a lot of symbols that don't fit in the cell,
    we truncate it to avoid performance issues.
    Used 6 as a multiplier because 1 symbol takes ~6px width
    + 5 to make sure there are extra symbols for ellipsis
  */
  return getEditableValue(value, true).slice(0, (size / 6) + 5)
}

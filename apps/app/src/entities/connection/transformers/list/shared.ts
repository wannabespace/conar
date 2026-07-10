import { tryParseJson } from '@conar/shared/utils/helpers'

export function parseToArray<T>(
  value: T,
  engineParser?: (str: T) => string[] | undefined,
): string[] {
  if (value === null || value === undefined || value === '')
    return []

  if (Array.isArray(value))
    return value.map(String)

  if (typeof value !== 'string')
    return [String(value)]

  if (value.startsWith('[')) {
    const parsed = tryParseJson<unknown[]>(value)
    if (Array.isArray(parsed))
      return parsed.map(String)

    throw new Error('Invalid JSON array format')
  }

  if (engineParser) {
    const result = engineParser(value)
    if (result)
      return result
  }

  return [value]
}

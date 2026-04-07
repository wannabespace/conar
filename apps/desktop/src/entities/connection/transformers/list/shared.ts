import { tryParseJson } from '@conar/shared/utils/helpers'

export function parseToArray(
  value: unknown,
  engineParser?: (str: string) => string[] | undefined,
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
  }

  if (engineParser) {
    const result = engineParser(value)
    if (result)
      return result
  }

  return [value]
}

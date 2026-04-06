import type { ValueTransformer } from '../'
import { tryParseJson } from '@conar/shared/utils/helpers'
import { prepareValueForEditor } from '../base'

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

export function parseToJsonArray(editedValue: string): string[] {
  const parsed = tryParseJson<unknown[]>(editedValue)
  if (Array.isArray(parsed))
    return parsed.map(String)
  return [editedValue]
}

export function createBaseListTransformer(opts: {
  parseFromDb: (value: unknown) => string[]
  toDbFormat: (items: string[]) => string
}): ValueTransformer {
  return {
    toEditable(value: unknown): string {
      return prepareValueForEditor(opts.parseFromDb(value))
    },
    toDb(editedValue: string): string {
      return opts.toDbFormat(parseToJsonArray(editedValue))
    },
  }
}

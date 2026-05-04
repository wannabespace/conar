import type { ValueTransformer } from '../create-transformer'
import { getDisplayValue } from '../create-transformer'
import { parseToArray } from './shared'

function parseMysqlSet(value: string): string[] | undefined {
  if (value.includes(','))
    return value.split(',').map(v => v.trim())
}

export function createMysqlListTransformer(): ValueTransformer<string[]> {
  return {
    toDisplay: getDisplayValue,
    fromConnection: value => ({
      toUI: () =>
        Array.isArray(value)
          ? value.map(String)
          : typeof value === 'string'
            ? parseToArray(value, parseMysqlSet)
            : [],
      toRaw: () =>
        Array.isArray(value)
          ? value.map(String).join(',')
          : typeof value === 'string'
            ? parseToArray(value, parseMysqlSet).join(',')
            : '[]',
    }),
    toConnection: {
      fromUI: value => value.join(','),
      fromRaw: raw => raw,
    },
  }
}

import type { ValueTransformer } from '../create-transformer'
import { getDisplayValue } from '../create-transformer'
import { parseToArray } from './shared'

const parseMysqlSet = (value: string): string[] | undefined => {
  if (value.includes(',')) {
    return value.split(',').map((v) => v.trim())
  }
}

const rawFromMysqlValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(String).join(',')
  }
  if (typeof value === 'string') {
    return parseToArray(value, parseMysqlSet).join(',')
  }
  return '[]'
}

const uiFromMysqlValue = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String)
  }
  if (typeof value === 'string') {
    return parseToArray(value, parseMysqlSet)
  }
  return []
}

export const createMysqlListTransformer = (): ValueTransformer<string[]> => ({
  fromConnection: (value) => ({
    toRaw: () => rawFromMysqlValue(value),
    toUI: () => uiFromMysqlValue(value),
  }),
  toConnection: {
    fromRaw: (raw) => raw,
    fromUI: (value) => value.join(','),
  },
  toDisplay: getDisplayValue,
})

import type { ValueTransformer } from '../types'
import { createBaseListTransformer, parseToArray } from './shared'

function parseMysqlSet(value: string): string[] | undefined {
  if (value.includes(','))
    return value.split(',').map(v => v.trim())
}

export function createMysqlListTransformer(): ValueTransformer {
  return createBaseListTransformer({
    parseFromDb: value => parseToArray(value, parseMysqlSet),
    toDbFormat: items => items.join(','),
  })
}

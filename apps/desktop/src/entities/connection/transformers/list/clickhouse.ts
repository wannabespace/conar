import type { ValueTransformer } from '../types'
import { createBaseListTransformer, parseToArray } from './shared'

export function createClickHouseListTransformer(): ValueTransformer {
  return createBaseListTransformer({
    parseFromDb: value => parseToArray(value),
    toDbFormat: items => JSON.stringify(items),
  })
}

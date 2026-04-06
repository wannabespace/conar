import type { ValueTransformer } from '../'
import { createBaseListTransformer, parseToArray } from './shared'

export function createClickHouseListTransformer(): ValueTransformer {
  return createBaseListTransformer({
    parseFromDb: value => parseToArray(value),
    toDbFormat: items => JSON.stringify(items),
  })
}

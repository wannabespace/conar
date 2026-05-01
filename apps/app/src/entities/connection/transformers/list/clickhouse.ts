import type { ValueTransformer } from '../create-transformer'
import { getDisplayValue } from '../create-transformer'
import { parseToArray } from './shared'

export function createClickHouseListTransformer(): ValueTransformer<string[]> {
  return {
    toDisplay: getDisplayValue,
    fromConnection: value => ({
      toUI: () => parseToArray(value),
      toRaw: () => typeof value === 'string' ? value : JSON.stringify(value),
    }),
    toConnection: {
      fromUI: value => value,
      fromRaw: raw => parseToArray(raw),
    },
  }
}

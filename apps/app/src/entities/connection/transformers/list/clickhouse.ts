import type { ValueTransformer } from '../value-transformer'
import { getDisplayValue } from '../value-transformer'
import { parseToArray } from './shared'

export const createClickHouseListTransformer = (): ValueTransformer<
  string[]
> => ({
  fromConnection: (value) => ({
    toRaw: () => (typeof value === 'string' ? value : JSON.stringify(value)),
    toUI: () => parseToArray(value),
  }),
  toConnection: {
    fromRaw: (raw) => parseToArray(raw),
    fromUI: (value) => value,
  },
  toDisplay: getDisplayValue,
})

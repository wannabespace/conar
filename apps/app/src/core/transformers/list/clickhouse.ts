import type { ValueTransformer } from '~/core/transformers/value-transformer'
import { getDisplayValue } from '~/core/transformers/value-transformer'

import { parseToArray } from './parse'

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

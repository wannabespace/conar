import { getValueForEditor } from '~/entities/connection/utils/helpers'

import type { ValueTransformer } from './value-transformer'
import { getDisplayValue } from './value-transformer'

export const createRawTransformer = (): ValueTransformer<unknown> => ({
  fromConnection: (value) => ({
    toRaw: () => getValueForEditor(value),
    toUI: () => getValueForEditor(value),
  }),
  toConnection: {
    fromRaw: (raw) => raw,
    fromUI: (value) => value,
  },
  toDisplay: getDisplayValue,
})

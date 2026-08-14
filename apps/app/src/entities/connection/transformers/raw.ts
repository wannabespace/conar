import { getValueForEditor } from '~/entities/connection/utils/helpers'

import type { ValueTransformer } from './create-transformer'
import { getDisplayValue } from './create-transformer'

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

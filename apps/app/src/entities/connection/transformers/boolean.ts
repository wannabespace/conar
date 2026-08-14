import { getValueForEditor } from '~/entities/connection/utils/helpers'

import type { ValueTransformer } from './create-transformer'
import { getDisplayValue } from './create-transformer'

const toBooleanUiString = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (value === 0 || value === 1) {
    return !!value
  }
  return !!value
}

export const createBooleanTransformer = (): ValueTransformer<boolean> => ({
  fromConnection: (value) => ({
    toRaw: () => getValueForEditor(value),
    toUI: () => toBooleanUiString(value),
  }),
  toConnection: {
    fromRaw: (raw) => raw,
    fromUI: (value) => value,
  },
  toDisplay: getDisplayValue,
})

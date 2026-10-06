import { getValueForEditor } from '~/core/connection/utils'

import type { ValueTransformer } from './value-transformer'
import { getDisplayValue } from './value-transformer'

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

const BOOLEAN_TEXT: Record<string, boolean> = {
  0: false,
  1: true,
  f: false,
  false: false,
  t: true,
  true: true,
}

export const createBooleanTransformer = (): ValueTransformer<boolean> => ({
  fromConnection: (value) => ({
    toRaw: () => getValueForEditor(value),
    toUI: () => toBooleanUiString(value),
  }),
  toConnection: {
    fromRaw: (raw) => {
      const value = BOOLEAN_TEXT[raw.trim().toLowerCase()]
      if (value === undefined) {
        throw new Error('Enter true or false')
      }
      return value
    },
    fromUI: (value) => value,
  },
  toDisplay: getDisplayValue,
})

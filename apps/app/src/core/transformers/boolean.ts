import { getValueForEditor } from '~/core/connection/utils'

import type { ValueTransformer } from './value-transformer'
import { getDisplayValue } from './value-transformer'

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
    toUI: () => Boolean(value),
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

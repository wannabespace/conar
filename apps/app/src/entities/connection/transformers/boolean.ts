import type { ValueTransformer } from './create-transformer'
import { getValueForEditor } from '~/entities/connection/utils/helpers'
import { getDisplayValue } from './create-transformer'

function toBooleanUiString(value: unknown): boolean {
  if (value === null || value === undefined)
    return false
  if (typeof value === 'boolean')
    return value
  if (value === 0 || value === 1)
    return !!value
  return !!value
}

export function createBooleanTransformer(): ValueTransformer<boolean> {
  return {
    toDisplay: getDisplayValue,
    fromConnection: value => ({
      toUI: () => toBooleanUiString(value),
      toRaw: () => getValueForEditor(value),
    }),
    toConnection: {
      fromUI: value => value,
      fromRaw: raw => raw,
    },
  }
}

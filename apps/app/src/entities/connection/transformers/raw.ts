import type { ValueTransformer } from './create-transformer'
import { getValueForEditor } from '~/entities/connection/utils/helpers'
import { getDisplayValue } from './create-transformer'

export function createRawTransformer(): ValueTransformer<unknown> {
  return {
    toDisplay: getDisplayValue,
    fromConnection: value => ({
      toUI: () => getValueForEditor(value),
      toRaw: () => getValueForEditor(value),
    }),
    toConnection: {
      fromUI: value => value,
      fromRaw: raw => raw,
    },
  }
}

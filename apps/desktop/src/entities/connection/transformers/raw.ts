import type { ValueTransformer } from './create-transformer'
import { getValueForEditor } from './base'

export function createRawTransformer(): ValueTransformer<unknown> {
  return {
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

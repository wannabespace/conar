import type { ValueTransformer } from './types'
import { prepareValueForEditor } from './base'

export function createRawTransformer(): ValueTransformer {
  return {
    toEditable(value: unknown): string {
      return prepareValueForEditor(value)
    },

    toDb(editedValue: string): string {
      return editedValue
    },
  }
}

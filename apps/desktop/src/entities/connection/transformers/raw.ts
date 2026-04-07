import type { ValueTransformer } from './'
import { getValueForEditor } from './base'

export function createRawTransformer(): ValueTransformer {
  return {
    toEditable(value: unknown): string {
      return getValueForEditor(value)
    },

    toDb(editedValue: string): string {
      return editedValue
    },
  }
}

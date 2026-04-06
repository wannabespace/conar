import type { ValueTransformer } from './'
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

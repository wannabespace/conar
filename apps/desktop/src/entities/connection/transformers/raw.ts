import type { ValueTransformer } from './types'
import { prepareValue, stringifyForEditor, truncateForDisplay, valueToDisplayString, valueToRawString } from './base'

export function createRawTransformer(): ValueTransformer {
  return {
    toDisplay(value: unknown, maxWidth: number): string {
      return truncateForDisplay(valueToDisplayString(value), maxWidth)
    },

    toEditable(value: unknown): string {
      const prepared = prepareValue(value)

      if (typeof prepared === 'object' && prepared !== null)
        return stringifyForEditor(prepared)

      return String(prepared ?? '')
    },

    toDb(editedValue: string): string {
      return editedValue
    },

    toRaw(value: unknown): string {
      return valueToRawString(value)
    },

    parseEditableToList(): string[] {
      return []
    },
  }
}

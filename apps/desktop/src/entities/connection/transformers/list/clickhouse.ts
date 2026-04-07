import type { ValueTransformer } from '../'
import { tryParseToJsonArray } from '@conar/shared/utils/helpers'
import { getValueForEditor } from '../base'
import { parseToArray } from './shared'

export function createClickHouseListTransformer(): ValueTransformer {
  return {
    toEditable(value: unknown): string {
      return getValueForEditor(parseToArray(value))
    },
    toDb(editedValue: string): string {
      return JSON.stringify(tryParseToJsonArray(editedValue))
    },
  }
}

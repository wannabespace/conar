import type { ValueTransformer } from '../'
import { tryParseToJsonArray } from '@conar/shared/utils/helpers'
import { getValueForEditor } from '../base'
import { parseToArray } from './shared'

function parseMysqlSet(value: string): string[] | undefined {
  if (value.includes(','))
    return value.split(',').map(v => v.trim())
}

export function createMysqlListTransformer(): ValueTransformer {
  return {
    toEditable(value: unknown): string {
      return getValueForEditor(parseToArray(value, parseMysqlSet))
    },
    toDb(editedValue: string): string {
      return tryParseToJsonArray(editedValue).join(',')
    },
  }
}

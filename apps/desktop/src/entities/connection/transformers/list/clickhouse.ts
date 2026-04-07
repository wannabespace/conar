import type { ValueTransformer } from '../'
import { tryParseToJsonArray } from '@conar/shared/utils/helpers'
import { getValueForEditor } from '../base'
import { parseToArray } from './shared'

/**
 * ClickHouse list transformer.
 *
 * `toDb` returns a **JS string array** (not a JSON string) so that
 * the ClickHouse dialect's `prepareQuery` handles it via its
 * `Array.isArray` branch, producing `['val1', 'val2']` with the
 * single-quoted literals ClickHouse expects.
 */
export function createClickHouseListTransformer(): ValueTransformer {
  return {
    toEditable(value: unknown): string {
      return getValueForEditor(parseToArray(value))
    },
    toDb(editedValue: string): string[] {
      return tryParseToJsonArray(editedValue)
    },
  }
}

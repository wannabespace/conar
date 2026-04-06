import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../components/table/cell/utils'
import type { ValueTransformer } from './types'
import { createListTransformer } from './list'
import { createRawTransformer } from './raw'

/**
 * Factory: (column, connectionType?) -> ValueTransformer
 *
 * Picks the right transformer based on the column's uiType and the DB engine.
 * Currently supports `list` (engine-aware) and `raw` (default).
 * Boolean, date/datetime, and niche types are deferred — they fall through to `raw`.
 */
export function createTransformer(column: Column, connectionType: ConnectionType): ValueTransformer {
  switch (column.uiType) {
    case 'list':
      return createListTransformer(connectionType)

    case 'boolean': {
      const base = createRawTransformer()
      return {
        ...base,
        // When boolean value is null, the CellSwitch component needs 'false'
        // (JSON.parse('') would throw). Preserves the original getEditableValue behavior.
        toEditable(value: unknown): string {
          if (value === null)
            return 'false'
          return base.toEditable(value)
        },
      }
    }

    // select, date, datetime all fall through to raw for now
    case 'select':
    case 'date':
    case 'datetime':
    case 'raw':
    default:
      return createRawTransformer()
  }
}

import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ValueTransformer } from '.'
import type { Column } from '../components/table/cell/utils'
import { createListTransformer } from './list'
import { createRawTransformer } from './raw'

export function createTransformer(column: Column, connectionType: ConnectionType): ValueTransformer {
  switch (column.uiType) {
    case 'list':
      return createListTransformer(connectionType)

    case 'boolean': {
      const base = createRawTransformer()
      return {
        ...base,
        toEditable(value: unknown): string {
          if (value === null)
            return 'false'
          return base.toEditable(value)
        },
      }
    }

    case 'select':
    case 'date':
    case 'datetime':
    case 'raw':
    default:
      return createRawTransformer()
  }
}

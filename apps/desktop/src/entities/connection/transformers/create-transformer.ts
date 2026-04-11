import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../components/table/cell/utils'
import { createBooleanTransformer } from './boolean'
import { createListTransformer } from './list'
import { createRawTransformer } from './raw'

export interface ValueTransformer<O = unknown> {
  fromConnection: (value: unknown) => {
    toUI: () => O
    toRaw: () => string
  }
  toConnection: {
    fromUI: (value: O) => unknown
    fromRaw: (value: string) => unknown
  }
}

// eslint-disable-next-line ts/no-explicit-any
export function createTransformer(connectionType: ConnectionType, column: Column): ValueTransformer<any> {
  switch (column.uiType) {
    case 'list':
      return createListTransformer(connectionType, column)

    case 'boolean':
      return createBooleanTransformer()

    case 'select':
    case 'date':
    case 'datetime':
    case 'raw':
    default:
      return createRawTransformer()
  }
}

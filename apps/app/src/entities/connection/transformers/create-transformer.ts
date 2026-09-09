import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { Column } from '../components/table/cell/utils'
import { createBooleanTransformer } from './boolean'
import { createListTransformer } from './list'
import { createRawTransformer } from './raw'
import { createTimeTransformer } from './time'
import type { ValueTransformer } from './value-transformer'

export const createTransformer = (
  connectionType: ConnectionType,
  column: Column
  // oxlint-disable-next-line ts/no-explicit-any
): ValueTransformer<any> => {
  switch (column.uiType) {
    case 'list': {
      return createListTransformer(connectionType, column)
    }

    case 'boolean': {
      return createBooleanTransformer()
    }

    case 'time': {
      return createTimeTransformer(column)
    }

    default: {
      return createRawTransformer()
    }
  }
}

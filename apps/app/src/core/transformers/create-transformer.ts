import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { tryCatch } from '@tamery/shared/utils'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { Column } from '~/core/table/cell/utils'

import { createBooleanTransformer } from './boolean'
import { createListTransformer } from './list'
import {
  createBytesTransformer,
  createClickHouseJsonTransformer,
  createJsonTransformer,
  createRawTransformer,
} from './raw'
import { createTimeTransformer } from './time.ts'
import type { ValueTransformer } from './value-transformer'

export const createTransformer = (
  connectionType: ConnectionType,
  column: Column
  // oxlint-disable-next-line ts/no-explicit-any
): ValueTransformer<any> => {
  const type = column.type ?? ''
  const { bytesColumnTypes, jsonColumnType } = capabilitiesOf(connectionType)
  if (jsonColumnType.test(type)) {
    return connectionType === ConnectionType.ClickHouse
      ? createClickHouseJsonTransformer(type)
      : createJsonTransformer()
  }
  if (bytesColumnTypes.includes(type)) {
    return createBytesTransformer()
  }

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

/** Cell text to the value staged for it; `null` text is NULL. */
export const parseCellText = (
  connectionType: ConnectionType,
  column: Column,
  text: string | null
) =>
  tryCatch(() =>
    text === null
      ? null
      : createTransformer(connectionType, column).toConnection.fromRaw(text)
  )

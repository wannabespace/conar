import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { tryCatch } from '@tamery/shared/utils'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { Column } from '~/core/table/cell/utils'

import { createBooleanTransformer } from './boolean'
import { createDateTransformer } from './date'
import { createListTransformer } from './list'
import {
  createBytesTransformer,
  createJsonTransformer,
  createRawTransformer,
  createUuidTransformer,
} from './raw'
import { createTimeTransformer } from './time.ts'
import type { ValueTransformer } from './value-transformer'

export const createTransformer = (
  connectionType: ConnectionType,
  column: Column
  // oxlint-disable-next-line ts/no-explicit-any
): ValueTransformer<any> => {
  const type = column.type ?? ''
  const { bytesColumnTypes, jsonColumnType, uuidColumnType } =
    capabilitiesOf(connectionType)
  if (jsonColumnType.test(type)) {
    return createJsonTransformer()
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

    case 'date':
    case 'datetime': {
      return createDateTransformer(column)
    }

    default: {
      return uuidColumnType?.test(type)
        ? createUuidTransformer()
        : createRawTransformer()
    }
  }
}

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

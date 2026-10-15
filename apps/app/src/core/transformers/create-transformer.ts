import type { SqlDialect } from '@tamery/shared/enums/connection-type'
import { toError } from '@tamery/shared/utils'
import { Result } from 'better-result'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { Column } from '~/core/table/cell/utils'
import { isNumericColumn } from '~/core/table/cell/utils'

import { createBooleanTransformer } from './boolean'
import { createDateTransformer } from './date'
import { createListTransformer } from './list'
import {
  createBytesTransformer,
  createEnumTransformer,
  createJsonTransformer,
  createNumberTransformer,
  createRawTransformer,
  createUuidTransformer,
} from './raw'
import { createTimeTransformer } from './time.ts'
import type { ValueTransformer } from './value-transformer'

export const createTransformer = (
  dialect: SqlDialect,
  column: Column
  // oxlint-disable-next-line ts/no-explicit-any
): ValueTransformer<any> => {
  const type = column.type ?? ''
  const { bytes, json, uuid } = capabilitiesOf(dialect).columnTypes
  if (json.test(type)) {
    return createJsonTransformer()
  }
  if (bytes?.test(type)) {
    return createBytesTransformer()
  }

  switch (column.uiType) {
    case 'list': {
      return createListTransformer(dialect, column)
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

    case 'select': {
      return column.availableValues
        ? createEnumTransformer(
            column.availableValues,
            column.isNullable ?? false
          )
        : createRawTransformer()
    }

    default: {
      if (isNumericColumn(column)) {
        return createNumberTransformer(column.isNullable ?? false)
      }
      return uuid?.test(type) ? createUuidTransformer() : createRawTransformer()
    }
  }
}

export const parseCellText = (
  dialect: SqlDialect,
  column: Column,
  text: string | null
) =>
  Result.try({
    catch: toError,
    try: () => {
      if (text !== null) {
        return createTransformer(dialect, column).toConnection.fromRaw(text)
      }
      if (column.isNullable === false) {
        throw new Error(`${column.id} cannot be null`)
      }
      return null
    },
  })

import { tryCatch } from '@tamery/shared/utils'
import { sql } from 'kysely'

import { getValueForEditor } from '~/core/connection/utils'

import type { ValueTransformer } from './value-transformer'
import { getDisplayValue } from './value-transformer'

export const createRawTransformer = (
  forEditor = getValueForEditor
): ValueTransformer<unknown> => ({
  fromConnection: (value) => ({
    toRaw: () => forEditor(value),
    toUI: () => forEditor(value),
  }),
  toConnection: {
    fromRaw: (raw) => raw,
    fromUI: (value) => value,
  },
  toDisplay: getDisplayValue,
})

const HEX_REGEX = /^0x(?:[\da-f]{2})*$/iu

export const createBytesTransformer = (): ValueTransformer<unknown> => ({
  ...createRawTransformer(),
  toConnection: {
    fromRaw: (raw) => {
      const hex = raw.trim()
      if (!HEX_REGEX.test(hex)) {
        throw new Error('Enter bytes as hex, like 0xDEADBEEF')
      }
      return Uint8Array.from(hex.slice(2).match(/../gu) ?? [], (byte) =>
        Number.parseInt(byte, 16)
      )
    },
    fromUI: (value) => value,
  },
})

export const createJsonTransformer = (): ValueTransformer<unknown> => ({
  // Drivers parse json, so a string scalar arrives bare and must get its quotes back, or the write is invalid json.
  ...createRawTransformer((value) =>
    value === null || value === undefined ? '' : JSON.stringify(value, null, 2)
  ),
  toConnection: {
    fromRaw: (raw) => {
      const { data, error } = tryCatch(() => JSON.parse(raw))
      if (error) {
        throw new Error('Invalid JSON')
      }
      return data
    },
    fromUI: (value) => value,
  },
  // Drafts hold parsed json like driver values do; bound as is, an array would become a SQL array and a string invalid json.
  toStatement: (value) =>
    value === null || value === undefined ? value : JSON.stringify(value),
})

// No string casts to a ClickHouse Map or Tuple; `format(JSONEachRow)` rejects a misfit where `JSONExtract` silently writes a default.
export const createClickHouseJsonTransformer = (
  columnType: string
): ValueTransformer<unknown> => ({
  ...createJsonTransformer(),
  toStatement: (value) =>
    sql`(select v from format(JSONEachRow, ${`v ${columnType}`}, ${`{"v":${JSON.stringify(value)}}`}))`,
})

import { tryCatch } from '@tamery/shared/utils'
import { hexToBytes } from '@tamery/shared/value-text'

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
      return hexToBytes(hex)
    },
    fromUI: (value) => value,
  },
})

// Lenient on purpose: engines also read `1_000`, `1,000.50`, `$1.00` (money) and `0x1F`.
const NUMBER_REGEX =
  /^[+-]?[$€£]?(?:[\d_,]*\.?\d[\d_]*(?:e[+-]?\d+)?|0x[\da-f_]+|inf(?:inity)?|nan)$/iu

export const createNumberTransformer = (
  nullable: boolean
): ValueTransformer<unknown> => ({
  ...createRawTransformer(),
  toConnection: {
    fromRaw: (raw) => {
      const text = raw.trim()
      if (text === '' && nullable) {
        return null
      }
      if (!NUMBER_REGEX.test(text)) {
        throw new Error('Enter a number, like 42 or 3.14')
      }
      return text
    },
    fromUI: (value) => value,
  },
})

export const createEnumTransformer = (
  values: string[],
  nullable: boolean
): ValueTransformer<unknown> => ({
  ...createRawTransformer(),
  toConnection: {
    fromRaw: (raw) => {
      if (raw === '' && nullable && !values.includes('')) {
        return null
      }
      if (!values.includes(raw)) {
        throw new Error('Pick one of the listed values')
      }
      return raw
    },
    fromUI: (value) => value,
  },
})

const UUID_REGEX =
  /^\{?[\da-f]{8}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{12}\}?$/iu

export const createUuidTransformer = (): ValueTransformer<unknown> => ({
  ...createRawTransformer(),
  toConnection: {
    fromRaw: (raw) => {
      const uuid = raw.trim()
      if (!UUID_REGEX.test(uuid)) {
        throw new Error(
          'Enter a UUID, like 01a02ef9-5d4f-72ba-8c04-0f6e8e450727'
        )
      }
      return uuid
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
})

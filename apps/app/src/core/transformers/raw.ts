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

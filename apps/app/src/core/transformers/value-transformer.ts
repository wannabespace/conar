import { valueToText } from '@tamery/shared/value-text'

type InputFromDB = unknown

export interface ValueTransformer<UI = unknown> {
  toDisplay: (value: InputFromDB, size: number) => string
  fromConnection: (value?: InputFromDB) => {
    toUI: () => UI
    toRaw: () => string
  }
  toConnection: {
    fromUI: (value: UI) => InputFromDB
    fromRaw: (value: string) => InputFromDB
  }
}

const textOf = (value: unknown) => {
  if (value === null) {
    return 'null'
  }
  if (value === '') {
    return 'empty'
  }
  return valueToText(value)
}

export const isNested = (value: unknown): value is object =>
  typeof value === 'object' &&
  value !== null &&
  !(value instanceof Date || value instanceof Uint8Array)

export const getDisplayValue = (value: unknown, size: number): string =>
  textOf(value)
    .replaceAll('\n', ' ')
    .slice(0, size / 6 + 5 + 50)

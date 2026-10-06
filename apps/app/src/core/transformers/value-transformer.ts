import { bytesToHex } from '~/core/connection/utils'

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
  /** What the UPDATE sets for a draft value the driver cannot bind as is; a Kysely expression is fine. */
  toStatement?: (value: InputFromDB) => unknown
}

export const getDisplayValue = (value: unknown, size: number): string => {
  let display: string

  if (value === null) {
    display = 'null'
  } else if (value === '') {
    display = 'empty'
  } else if (typeof value === 'string') {
    display = value
  } else if (value instanceof Uint8Array) {
    display = bytesToHex(value)
  } else if (value instanceof Date) {
    display = value.toISOString()
  } else if (typeof value === 'object') {
    display = JSON.stringify(value)
  } else {
    display = String(value)
  }

  return display.replaceAll('\n', ' ').slice(0, size / 6 + 5 + 50)
}

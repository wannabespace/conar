import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../components/table/cell/utils'
import { createBooleanTransformer } from './boolean'
import { createListTransformer } from './list'
import { createRawTransformer } from './raw'
import { createTimeTransformer } from './time'

type InputFromDB = unknown

export interface ValueTransformer<UI = unknown> {
  // Will render in the cell
  toDisplay: (value: InputFromDB, size: number) => string
  fromConnection: (value: InputFromDB) => {
    // Will render in the popover ui component
    toUI: () => UI
    // Will render in the popover raw editor
    toRaw: () => string
  }
  toConnection: {
    fromUI: (value: UI) => InputFromDB
    fromRaw: (value: string) => InputFromDB
  }
}

export function getDisplayValue(value: unknown, size: number): string {
  let display: string

  if (value === null) {
    display = 'null'
  }
  else if (value === '') {
    display = 'empty'
  }
  else if (typeof value === 'string') {
    display = value
  }
  else if (value instanceof Date) {
    display = value.toISOString()
  }
  else if (typeof value === 'object') {
    display = JSON.stringify(value)
  }
  else {
    display = String(value)
  }

  return display.replaceAll('\n', ' ').slice(0, (size / 6) + 5 + 50)
}

// eslint-disable-next-line ts/no-explicit-any
export function createTransformer(connectionType: ConnectionType, column: Column): ValueTransformer<any> {
  switch (column.uiType) {
    case 'list':
      return createListTransformer(connectionType, column)

    case 'boolean':
      return createBooleanTransformer()

    case 'time':
      return createTimeTransformer(column)

    case 'select':
    case 'date':
    case 'datetime':
    case 'raw':
    default:
      return createRawTransformer()
  }
}

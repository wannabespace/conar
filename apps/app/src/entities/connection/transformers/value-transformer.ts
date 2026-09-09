type InputFromDB = unknown

export interface ValueTransformer<UI = unknown> {
  // Will render in the cell
  toDisplay: (value: InputFromDB, size: number) => string
  fromConnection: (value?: InputFromDB) => {
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

export const getDisplayValue = (value: unknown, size: number): string => {
  let display: string

  if (value === null) {
    display = 'null'
  } else if (value === '') {
    display = 'empty'
  } else if (typeof value === 'string') {
    display = value
  } else if (value instanceof Date) {
    display = value.toISOString()
  } else if (typeof value === 'object') {
    display = JSON.stringify(value)
  } else {
    display = String(value)
  }

  return display.replaceAll('\n', ' ').slice(0, size / 6 + 5 + 50)
}

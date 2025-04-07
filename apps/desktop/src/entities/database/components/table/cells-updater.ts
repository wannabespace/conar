export interface CellUpdaterFunction {
  (rowIndex: number, columnIndex: number, value: string | null): Promise<void>
}

export interface CellUpdaterOptions {
  setValue: (rowIndex: number, columnIndex: number, value: string | null) => void
  saveValue: (rowIndex: number, columnIndex: number, value: string | null) => Promise<void>
  getValue: (rowIndex: number, columnIndex: number) => string | null
}

export function createCellUpdater() {
  const cachedValues: Record<string, string | null> = {}

  function getKey(rowIndex: number, columnIndex: number) {
    return `${rowIndex}.${columnIndex}`
  }

  return ({ setValue, saveValue, getValue }: CellUpdaterOptions): CellUpdaterFunction => {
    return async (rowIndex: number, columnIndex: number, value: string | null) => {
      const key = getKey(rowIndex, columnIndex)

      try {
        cachedValues[key] = getValue(rowIndex, columnIndex)

        setValue(rowIndex, columnIndex, value)
        await saveValue(rowIndex, columnIndex, value)
      }
      catch (error) {
        setValue(rowIndex, columnIndex, cachedValues[key])

        throw error
      }
      finally {
        delete cachedValues[key]
      }
    }
  }
}

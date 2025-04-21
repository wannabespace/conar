export interface CellUpdaterFunction {
  (rowIndex: number, columnName: string, value: unknown): Promise<void>
}

export interface CellUpdaterOptions {
  setValue: (rowIndex: number, columnName: string, value: unknown) => void
  saveValue: (rowIndex: number, columnName: string, value: unknown) => Promise<void>
  getValue: (rowIndex: number, columnName: string) => unknown
}

function getKey(rowIndex: number, columnName: string) {
  return `${rowIndex}.${columnName}`
}

export function createCellUpdater() {
  const cachedValues: Record<string, unknown> = {}

  return ({ setValue, saveValue, getValue }: CellUpdaterOptions): CellUpdaterFunction => {
    return async (rowIndex: number, columnName: string, value: unknown) => {
      const key = getKey(rowIndex, columnName)

      try {
        cachedValues[key] = getValue(rowIndex, columnName)

        setValue(rowIndex, columnName, value)
        await saveValue(rowIndex, columnName, value)
      }
      catch (error) {
        setValue(rowIndex, columnName, cachedValues[key])

        throw error
      }
      finally {
        delete cachedValues[key]
      }
    }
  }
}

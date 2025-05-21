export interface CellUpdaterFunction {
  (rowIndex: number, columnName: string, value: unknown): Promise<void>
}

export interface CellUpdaterOptions {
  getValue: (rowIndex: number, columnName: string) => unknown
  setValue: (rowIndex: number, columnName: string, value: unknown) => void
  saveValue: (rowIndex: number, columnName: string, value: unknown) => Promise<void>
}

export function createCellUpdater({ getValue, setValue, saveValue }: CellUpdaterOptions): CellUpdaterFunction {
  return async (rowIndex: number, columnName: string, value: unknown) => {
    const cachedValue = getValue(rowIndex, columnName)

    try {
      setValue(rowIndex, columnName, value)
      await saveValue(rowIndex, columnName, value)
    }
    catch (error) {
      setValue(rowIndex, columnName, cachedValue)

      throw error
    }
  }
}

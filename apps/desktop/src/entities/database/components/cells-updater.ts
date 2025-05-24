export interface CellUpdaterFunction {
  ({ rowIndex, columnId, newValue, oldValue }: { rowIndex: number, columnId: string, newValue: unknown, oldValue: unknown }): Promise<void>
}

export interface CellUpdaterOptions {
  setValue: (rowIndex: number, columnName: string, value: unknown) => void
  saveValue: (rowIndex: number, columnName: string, value: unknown) => Promise<void>
}

export function createCellUpdater({ setValue, saveValue }: CellUpdaterOptions): CellUpdaterFunction {
  return async ({ rowIndex, columnId, newValue, oldValue }) => {
    try {
      setValue(rowIndex, columnId, newValue)
      await saveValue(rowIndex, columnId, newValue)
    }
    catch (error) {
      setValue(rowIndex, columnId, oldValue)

      throw error
    }
  }
}

import type { UseMutateFunction } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import type { Column } from '../table'
import { useMutation } from '@tanstack/react-query'
import { createContext, use, useMemo, useState } from 'react'

interface CellContextValue {
  value: string
  setValue: Dispatch<SetStateAction<string>>
  column: Column
  initialValue: unknown
  displayValue: string
  update: UseMutateFunction<void, Error, { value: string | null, rowIndex: number }>
}

const CellContext = createContext<CellContextValue>(null!)

export function useCellContext() {
  return use(CellContext)
}

export function TableCellProvider({
  children,
  column,
  initialValue,
  displayValue,
  onSetValue,
  onSaveValue,
  onSaveError,
  onSaveSuccess,
  onSavePending,
}: {
  children: React.ReactNode
  column: Column
  initialValue: unknown
  displayValue: string
  onSetValue?: (rowIndex: number, columnsId: string, value: unknown) => void
  onSaveValue?: (rowIndex: number, columnsId: string, value: unknown) => Promise<void>
  onSaveError: (error: Error) => void
  onSaveSuccess: () => void
  onSavePending: () => void
}) {
  const [value, setValue] = useState<string>(() => initialValue === null ? '' : displayValue)

  const { mutate: update } = useMutation({
    mutationFn: async ({ rowIndex, value }: { value: string | null, rowIndex: number }) => {
      if (!onSetValue || !onSaveValue)
        return

      onSavePending()

      onSetValue(rowIndex, column.id, value)
      try {
        await onSaveValue(
          rowIndex,
          column.id,
          value,
        )
      }
      catch (e) {
        onSetValue(rowIndex, column.id, initialValue)
        throw e
      }
    },
    onSuccess: onSaveSuccess,
    onError: onSaveError,
  })

  const context = useMemo(() => ({
    value,
    setValue,
    column,
    initialValue,
    displayValue,
    update,
  }), [
    value,
    setValue,
    column,
    initialValue,
    displayValue,
    update,
  ])

  return <CellContext.Provider value={context}>{children}</CellContext.Provider>
}

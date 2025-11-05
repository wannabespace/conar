import type { UseMutateFunction } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import type { Column } from '../utils/table'
import { useMutation } from '@tanstack/react-query'
import { createContext, use, useMemo, useState } from 'react'
import { getEditableValue } from '../lib/render'

const CellContext = createContext<{
  value: string
  setValue: Dispatch<SetStateAction<string>>
  column: Column
  initialValue: unknown
  displayValue: string
  update: UseMutateFunction<void, Error, { value: string | null, rowIndex: number }>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export function useCellContext() {
  return use(CellContext)
}

export function TableCellProvider({
  children,
  column,
  initialValue,
  displayValue,
  onSaveValue,
  onSavePending,
  onSaveSuccess,
  onSaveError,
}: {
  children: React.ReactNode
  column: Column
  initialValue: unknown
  displayValue: string
  onSaveValue?: (rowIndex: number, columnsId: string, value: unknown) => Promise<void>
  onSavePending: () => void
  onSaveSuccess: () => void
  onSaveError?: (error: Error) => void
}) {
  const [value, setValue] = useState<string>(() => getEditableValue(initialValue, false))

  const { mutate: update } = useMutation({
    mutationFn: async ({ rowIndex, value }: { value: string | null, rowIndex: number }) => {
      if (!onSaveValue)
        return

      onSavePending()

      await onSaveValue(
        rowIndex,
        column.id,
        value,
      )
    },
    onError: onSaveError,
    onSuccess: onSaveSuccess,
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

  return <CellContext value={context}>{children}</CellContext>
}

import type { Column } from './utils'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { CellContext } from './cell-context'
import { getEditableValue } from './utils'

export function TableCellProvider({
  children,
  column,
  initialValue,
  displayValue,
  onSaveValue,
  onSavePending,
  onSaveSuccess,
  onSaveError,
  values,
}: {
  children: React.ReactNode
  column: Column
  initialValue: unknown
  displayValue: string
  onSaveValue?: (rowIndex: number, columnsId: string, value: unknown) => Promise<void>
  onSavePending: () => void
  onSaveSuccess: () => void
  onSaveError?: (error: Error) => void
  values?: string[]
}) {
  const [value, setValue] = useState<string>(() => getEditableValue({
    value: initialValue,
    oneLine: false,
    column,
  }))

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
    values,
  }), [
    value,
    setValue,
    column,
    initialValue,
    displayValue,
    update,
    values,
  ])

  return <CellContext value={context}>{children}</CellContext>
}

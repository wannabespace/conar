import type { ComponentProps } from 'react'
import type { TableCellProps, TableHeaderCellProps } from '~/components/table'
import { useMemo, useRef } from 'react'
import { useStore } from '@tanstack/react-store'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiSubtractLine } from '@remixicon/react'
import { usePageContext } from '..'
import { useTableContext } from '~/components/table'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { Route } from '..'
import { 
  extractPrimaryKey, 
  isPrimaryKeySelected, 
  addPrimaryKeyToSelection, 
  removePrimaryKeyFromSelection 
} from '../-lib/primary-keys'

function IndeterminateCheckbox({
  indeterminate,
  className,
  ...props
}: { indeterminate?: boolean } & ComponentProps<'input'>) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <input
        type="checkbox"
        className={cn(
          'peer appearance-none size-4 rounded-[4px] border border-border transition-colors outline-none duration-100',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'checked:bg-primary checked:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
          !props.checked && indeterminate && 'bg-primary border-primary',
          className,
        )}
        {...props}
      />
      <RiCheckLine
        className={cn(
          'absolute size-3 text-primary-foreground opacity-0 pointer-events-none peer-checked:opacity-100 transition-opacity duration-100',
        )}
      />
      <RiSubtractLine
        className="absolute size-3 text-primary-foreground opacity-0 pointer-events-none transition-opacity duration-100"
        style={{ opacity: !props.checked && indeterminate ? 1 : 0 }}
      />
    </div>
  )
}

export function SelectionHeaderCell({ columnIndex, className, size }: TableHeaderCellProps) {
  const rows = useTableContext(state => state.rows)
  const { store } = usePageContext()
  const { table, schema } = Route.useParams()
  const { database } = Route.useLoaderData()
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)
  
  const [checked, indeterminate] = useStore(store, state => [
    !!rows && rows.length > 0 && primaryKeys && state.selected.length === rows.length,
    state.selected.length > 0,
  ])

  return (
    <div className={cn('flex items-center w-fit', columnIndex === 0 && 'pl-4', className)} style={{ width: `${size}px` }}>
      <IndeterminateCheckbox
        disabled={!rows || rows.length === 0 || !primaryKeys}
        checked={checked}
        indeterminate={indeterminate}
        onChange={() => {
          if (!primaryKeys) return
          
          if (checked) {
            store.setState(state => ({
              ...state,
              selected: [],
            }))
          }
          else {
            store.setState(state => ({
              ...state,
              selected: rows?.map(row => extractPrimaryKey(row, primaryKeys)) ?? [],
            }))
          }
        }}
      />
    </div>
  )
}

export function SelectionCell({ rowIndex, columnIndex, className, size }: TableCellProps) {
  const { store } = usePageContext()
  const rows = useTableContext(state => state.rows)
  const { table, schema } = Route.useParams()
  const { database } = Route.useLoaderData()
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)
  
  const row = rows[rowIndex]
  const rowPrimaryKey = useMemo(() => {
    return primaryKeys && row ? extractPrimaryKey(row, primaryKeys) : null
  }, [row, primaryKeys])
  
  const isSelected = useStore(store, state => 
    rowPrimaryKey ? isPrimaryKeySelected(rowPrimaryKey, state.selected) : false
  )

  return (
    <div className={cn('flex items-center w-fit', columnIndex === 0 && 'pl-4', className)} style={{ width: `${size}px` }}>
      <IndeterminateCheckbox
        checked={isSelected}
        disabled={!rowPrimaryKey}
        onChange={() => {
          if (!rowPrimaryKey) return
          
          if (isSelected) {
            store.setState(state => ({
              ...state,
              selected: removePrimaryKeyFromSelection(state.selected, rowPrimaryKey),
            }))
          }
          else {
            store.setState(state => ({
              ...state,
              selected: addPrimaryKeyToSelection(state.selected, rowPrimaryKey),
            }))
          }
        }}
      />
    </div>
  )
}

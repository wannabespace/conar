import type { ComponentProps } from 'react'
import type { TableCellProps, TableHeaderCellProps } from '~/components/table'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiSubtractLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useTableContext } from '~/components/table'
import { usePageStoreContext } from '../-store'

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

export function SelectionHeaderCell({ columnIndex, className, size, keys }: TableHeaderCellProps & { keys: string[] }) {
  const rows = useTableContext(state => state.rows)
  const store = usePageStoreContext()
  const [checked, indeterminate] = useStore(store, state => [
    !!rows && rows.length > 0 && state.selected.length === rows.length,
    state.selected.length > 0,
  ])

  return (
    <div className={cn('flex items-center w-fit', columnIndex === 0 && 'pl-4', className)} style={{ width: `${size}px` }}>
      <IndeterminateCheckbox
        disabled={!rows || rows.length === 0}
        checked={checked}
        indeterminate={indeterminate}
        onChange={() => {
          if (checked) {
            store.setState(state => ({
              ...state,
              selected: [],
            } satisfies typeof state))
          }
          else {
            store.setState(state => ({
              ...state,
              selected: rows?.map(row => keys.reduce((acc, key) => ({ ...acc, [key]: row[key] }), {})) ?? [],
            } satisfies typeof state))
          }
        }}
      />
    </div>
  )
}

export function SelectionCell({ rowIndex, columnIndex, className, size, keys }: TableCellProps & { keys: string[] }) {
  const store = usePageStoreContext()
  const rows = useTableContext(state => state.rows)
  const isSelected = useStore(store, state => state.selected.some(row => keys.every(key => row[key] === rows[rowIndex]![key])))

  return (
    <div className={cn('flex items-center w-fit', columnIndex === 0 && 'pl-4', className)} style={{ width: `${size}px` }}>
      <IndeterminateCheckbox
        checked={isSelected}
        onChange={() => {
          if (isSelected) {
            store.setState(state => ({
              ...state,
              selected: store.state.selected.filter(row => !keys.every(key => row[key] === rows[rowIndex]![key])),
            } satisfies typeof state))
          }
          else {
            store.setState(state => ({
              ...state,
              selected: [...state.selected, keys.reduce((acc, key) => ({ ...acc, [key]: rows[rowIndex]![key] }), {})],
            } satisfies typeof state))
          }
        }}
      />
    </div>
  )
}

import type { CellContext } from '@tanstack/react-table'
import type { ComponentProps } from 'react'
import { cn } from '@connnect/ui/lib/utils'
import { RiCheckLine, RiSubtractLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useTableStoreContext } from '.'

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

export function SelectionHeaderCell() {
  const store = useTableStoreContext()
  const [disabled, checked, indeterminate] = useStore(store, state => [
    state.rows.length === 0,
    state.rows.length > 0 && state.selected.length === state.rows.length,
    state.selected.length > 0,
  ])

  return (
    <div className="group-first/header:pl-4 flex items-center size-full">
      <IndeterminateCheckbox
        disabled={disabled}
        checked={checked}
        indeterminate={indeterminate}
        onChange={() => {
          if (checked) {
            store.setState(state => ({
              ...state,
              selected: [],
            }))
          }
          else {
            store.setState(state => ({
              ...state,
              selected: state.rows,
            }))
          }
        }}
      />
    </div>
  )
}

export function SelectionCell({ row }: CellContext<Record<string, unknown>, unknown>) {
  const store = useTableStoreContext()
  const isSelected = useStore(store, state => state.selected.includes(row.index))

  return (
    <div className="group-first/cell:pl-4 flex items-center size-full">
      <IndeterminateCheckbox
        checked={isSelected}
        onChange={() => {
          if (isSelected) {
            store.setState(state => ({
              ...state,
              selected: store.state.selected.filter(index => index !== row.index),
            }))
          }
          else {
            store.setState(state => ({
              ...state,
              selected: [...state.selected, row.index],
            }))
          }
        }}
      />
    </div>
  )
}

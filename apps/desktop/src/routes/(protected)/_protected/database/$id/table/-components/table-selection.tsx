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
          `
            peer size-4 appearance-none rounded-[4px] border border-border
            transition-colors duration-100 outline-none
          `,
          `
            focus-visible:border-ring focus-visible:ring-[3px]
            focus-visible:ring-ring/50
          `,
          `
            checked:border-primary checked:bg-primary
            disabled:cursor-not-allowed disabled:opacity-50
          `,
          !props.checked && indeterminate && 'border-primary bg-primary',
          className,
        )}
        {...props}
      />
      <RiCheckLine
        className={cn(
          `
            pointer-events-none absolute size-3 text-primary-foreground
            opacity-0 transition-opacity duration-100
            peer-checked:opacity-100
          `,
        )}
      />
      <RiSubtractLine
        className={`
          pointer-events-none absolute size-3 text-primary-foreground opacity-0
          transition-opacity duration-100
        `}
        style={{ opacity: !props.checked && indeterminate ? 1 : 0 }}
      />
    </div>
  )
}

export function SelectionHeaderCell({ columnIndex, className, size, keys }: TableHeaderCellProps & {
  keys: string[]
  className?: string
}) {
  const rows = useTableContext(state => state.rows)
  const store = usePageStoreContext()
  const [checked, indeterminate] = useStore(store, state => [
    !!rows && rows.length > 0 && state.selected.length === rows.length,
    state.selected.length > 0,
  ])

  return (
    <div className={cn('flex w-fit items-center', columnIndex === 0 && 'pl-4', className)} style={{ width: `${size}px` }}>
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

export function SelectionCell({ rowIndex, columnIndex, className, size, keys }: TableCellProps & {
  keys: string[]
  className?: string
}) {
  const store = usePageStoreContext()
  const rows = useTableContext(state => state.rows)
  const isSelected = useStore(store, state => state.selected.some(row => keys.every(key => row[key] === rows[rowIndex]![key])))

  return (
    <div className={cn('flex w-fit items-center', columnIndex === 0 && 'pl-4', className)} style={{ width: `${size}px` }}>
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

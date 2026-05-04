import type { TableCellProps, TableHeaderCellProps } from '@conar/table'
import type { ComponentProps } from 'react'
import { useShiftSelectionClick, useTableContext } from '@conar/table/hooks'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiSubtractLine } from '@remixicon/react'
import { useSubscription } from 'seitu/react'
import { isNewRow, useTablePageStore } from '../../-store'

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
            peer hit-area-2.5 size-4 appearance-none rounded-sm border
            border-border transition-colors duration-100 outline-none
            checked:border-primary checked:bg-primary
            focus-visible:border-ring focus-visible:ring-[0.1875rem]
            focus-visible:ring-ring/50
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
        className="
          pointer-events-none absolute size-3 text-primary-foreground opacity-0
          transition-opacity duration-100
        "
        style={{ opacity: !props.checked && indeterminate ? 1 : 0 }}
      />
    </div>
  )
}

export function SelectionHeaderCell({ columnIndex, className, style, keys }: TableHeaderCellProps & {
  keys: string[]
  className?: string
}) {
  const rows = useTableContext(state => state.rows)
  const selectableRows = rows.filter(row => !isNewRow(row))
  const store = useTablePageStore()
  const [checked, indeterminate] = useSubscription(store, {
    selector: state => [
      selectableRows.length > 0 && state.selected.length === selectableRows.length,
      state.selected.length > 0,
    ],
  })

  return (
    <div
      className={cn('flex shrink-0 items-center px-2', columnIndex === 0 && `
        pl-4
      `, className)}
      style={style}
    >
      <IndeterminateCheckbox
        disabled={selectableRows.length === 0}
        checked={checked}
        indeterminate={indeterminate}
        onChange={() => {
          if (checked) {
            store.set(state => ({
              ...state,
              selected: [],
            } satisfies typeof state))
          }
          else {
            store.set(state => ({
              ...state,
              selected: selectableRows.map(row => keys.reduce((acc, key) => ({ ...acc, [key]: row[key] }), {})),
            } satisfies typeof state))
          }
        }}
      />
    </div>
  )
}

export function SelectionCell({ rowIndex, columnIndex, className, style, keys }: TableCellProps & {
  keys: string[]
  className?: string
}) {
  const store = useTablePageStore()
  const rows = useTableContext(state => state.rows)
  const row = rows[rowIndex]
  const isSelectable = !!row && !isNewRow(row)
  const { isSelected, currentSelected, lastClickedIndex } = useSubscription(store, {
    selector: state => ({
      isSelected: isSelectable && state.selected.some(s => keys.every(key => s[key] === row![key])),
      currentSelected: state.selected,
      lastClickedIndex: state.lastClickedIndex,
    }),
  })

  const rowKey = isSelectable
    ? keys.reduce<Record<string, string>>(
        (acc, key) => ({ ...acc, [key]: row![key] as string }),
        {},
      )
    : {}

  const { handleMouseDown, handleKeyDown, handleChange } = useShiftSelectionClick({
    rowKey,
    rowIndex,
    currentSelected,
    lastClickedIndex,
    getItemsInRange: (start, end) => rows.slice(start, end + 1)
      .filter(row => !isNewRow(row))
      .map(row =>
        keys.reduce<Record<string, string>>(
          (acc, key) => ({ ...acc, [key]: row[key] as string }),
          {},
        ),
      ),
    onSelectionChange: (selected, selectionState, newLastClickedIndex) => {
      store.set(state => ({
        ...state,
        selected,
        selectionState,
        lastClickedIndex: newLastClickedIndex,
      } satisfies typeof state))
    },
  })

  return (
    <div
      className={cn('flex items-center px-2', columnIndex === 0 && 'pl-4', className)}
      style={style}
    >
      {isSelectable && (
        <IndeterminateCheckbox
          checked={isSelected}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
        />
      )}
    </div>
  )
}

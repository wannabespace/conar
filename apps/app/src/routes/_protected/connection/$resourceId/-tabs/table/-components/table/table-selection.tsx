import { RiCheckLine, RiSubtractLine } from '@remixicon/react'
import type { TableCellProps, TableHeaderCellProps } from '@tamery/table'
import { useShiftSelectionClick, useTableContext } from '@tamery/table/hooks'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'
import { useSubscription } from 'seitu/react'

import { useTablePageStore } from '../../-lib/store'

const IndeterminateCheckbox = ({
  indeterminate,
  className,
  ...props
}: { indeterminate?: boolean } & ComponentProps<'input'>) => (
  <div className="relative inline-flex items-center justify-center">
    <input
      type="checkbox"
      className={cn(
        `peer hit-area-2.5 border-border checked:border-primary checked:bg-primary focus-visible:border-ring focus-visible:ring-ring/50 size-4 appearance-none rounded-sm border transition-colors duration-100 outline-none focus-visible:ring-[0.1875rem] disabled:cursor-not-allowed disabled:opacity-50`,
        !props.checked && indeterminate && 'border-primary bg-primary',
        className
      )}
      {...props}
    />
    <RiCheckLine
      className={cn(
        `text-primary-foreground pointer-events-none absolute size-3 opacity-0 transition-opacity duration-100 peer-checked:opacity-100`
      )}
    />
    <RiSubtractLine
      className="text-primary-foreground pointer-events-none absolute size-3 opacity-0 transition-opacity duration-100"
      style={{ opacity: !props.checked && indeterminate ? 1 : 0 }}
    />
  </div>
)

const rowKeyFromKeys = (
  keys: string[],
  row: Record<string, unknown> | undefined
) =>
  Object.fromEntries(
    keys.map((key) => [key, (row?.[key] ?? '') as string])
  ) as Record<string, string>

export const SelectionHeaderCell = ({
  columnIndex,
  className,
  style,
  keys,
}: TableHeaderCellProps & {
  keys: string[]
  className?: string
}) => {
  const rows = useTableContext((state) => state.rows)
  const store = useTablePageStore()
  const [checked, indeterminate] = useSubscription(store, {
    selector: (state) => [
      !!rows && rows.length > 0 && state.selected.length === rows.length,
      state.selected.length > 0,
    ],
  })

  return (
    <div
      className={cn(
        'flex shrink-0 items-center px-2',
        columnIndex === 0 && `pl-4`,
        className
      )}
      style={style}
    >
      <IndeterminateCheckbox
        disabled={!rows || rows.length === 0}
        checked={checked}
        indeterminate={indeterminate}
        onChange={() => {
          if (checked) {
            store.set(
              (state) =>
                ({
                  ...state,
                  selected: [],
                }) satisfies typeof state
            )
          } else {
            store.set(
              (state) =>
                ({
                  ...state,
                  selected: rows?.map((row) => rowKeyFromKeys(keys, row)) ?? [],
                }) satisfies typeof state
            )
          }
        }}
      />
    </div>
  )
}

export const SelectionCell = ({
  rowIndex,
  columnIndex,
  className,
  style,
  keys,
}: TableCellProps & {
  keys: string[]
  className?: string
}) => {
  const store = useTablePageStore()
  const rows = useTableContext((state) => state.rows)
  const currentRow = rows[rowIndex]
  const { isSelected, currentSelected, lastClickedIndex } = useSubscription(
    store,
    {
      selector: (state) => ({
        isSelected: state.selected.some((row) =>
          keys.every((key) => row[key] === currentRow?.[key])
        ),
        currentSelected: state.selected,
        lastClickedIndex: state.lastClickedIndex,
      }),
    }
  )

  const rowKey = rowKeyFromKeys(keys, currentRow)

  const { handleMouseDown, handleKeyDown, handleChange } =
    useShiftSelectionClick({
      rowKey,
      rowIndex,
      currentSelected,
      lastClickedIndex,
      getItemsInRange: (start, end) =>
        rows.slice(start, end + 1).map((row) => rowKeyFromKeys(keys, row)),
      onSelectionChange: (selected, selectionState, newLastClickedIndex) => {
        store.set(
          (state) =>
            ({
              ...state,
              selected,
              selectionState,
              lastClickedIndex: newLastClickedIndex,
            }) satisfies typeof state
        )
      },
    })

  return (
    <div
      className={cn(
        'flex items-center px-2',
        columnIndex === 0 && 'pl-4',
        className
      )}
      style={style}
    >
      <IndeterminateCheckbox
        checked={isSelected}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
      />
    </div>
  )
}

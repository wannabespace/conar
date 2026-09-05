import { MinusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { TableCellProps, TableHeaderCellProps } from '@tamery/table'
import {
  isShiftClick,
  reduceShiftClick,
  useTableContext,
  useTableStore,
} from '@tamery/table/hooks'
import { cn } from '@tamery/ui/lib/utils'
import type { ChangeEvent, ComponentProps } from 'react'
import { useSubscription } from 'seitu/react'

import { useTableSessionStore } from '../../-lib/session-store'

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
    <HugeiconsIcon
      icon={Tick02Icon}
      strokeWidth={2}
      className={cn(
        `text-primary-foreground pointer-events-none absolute size-3 opacity-0 transition-opacity duration-100 peer-checked:opacity-100`
      )}
    />
    <HugeiconsIcon
      icon={MinusSignIcon}
      strokeWidth={2}
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
  const tableStore = useTableStore()
  const rowCount = useTableContext((state) => state.rows.length)
  const store = useTableSessionStore()
  const [checked, indeterminate] = useSubscription(store, {
    selector: (state) => [
      rowCount > 0 && state.selected.length === rowCount,
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
        disabled={rowCount === 0}
        checked={checked}
        indeterminate={indeterminate}
        onChange={() => {
          store.set(
            (state) =>
              ({
                ...state,
                selected: checked
                  ? []
                  : tableStore
                      .get()
                      .rows.map((row) => rowKeyFromKeys(keys, row)),
              }) satisfies typeof state
          )
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
  const store = useTableSessionStore()
  const tableStore = useTableStore()
  const currentRow = useTableContext((state) => state.rows[rowIndex])
  const rowKey = rowKeyFromKeys(keys, currentRow)
  const { isSelected, currentSelected, lastClickedIndex } = useSubscription(
    store,
    {
      selector: (state) => ({
        currentSelected: state.selected,
        isSelected: state.selected.some((row) =>
          keys.every((key) => row[key] === currentRow?.[key])
        ),
        lastClickedIndex: state.lastClickedIndex,
      }),
    }
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const update = reduceShiftClick(isShiftClick(event), {
      currentSelected,
      getItemsInRange: (start, end) =>
        tableStore
          .get()
          .rows.slice(start, end + 1)
          .map((row) => rowKeyFromKeys(keys, row)),
      isSelected,
      lastClickedIndex,
      rowIndex,
      rowKey,
    })
    store.set(
      (state) =>
        ({
          ...state,
          lastClickedIndex: update.lastClickedIndex,
          selected: update.selected,
          selectionState: update.state,
        }) satisfies typeof state
    )
  }

  return (
    <div
      className={cn(
        'flex items-center px-2',
        columnIndex === 0 && 'pl-4',
        className
      )}
      style={style}
    >
      <IndeterminateCheckbox checked={isSelected} onChange={handleChange} />
    </div>
  )
}

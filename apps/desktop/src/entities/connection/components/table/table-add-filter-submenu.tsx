import type { ActiveFilter, Filter } from '@conar/shared/filters'
import { cellToFilterValues, FILTER_GROUPS, SQL_FILTERS_GROUPED } from '@conar/shared/filters'
import {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@conar/ui/components/context-menu'
import { Fragment } from 'react'
import { toast } from 'sonner'

function isDisabled(filter: Filter, hasRow: boolean, cellValue: unknown): boolean {
  return filter.hasValue !== false && (!hasRow || cellValue === null || cellValue === undefined)
}

export function TableAddFilterSubmenu({
  columnId,
  cellValue,
  hasRow,
  onAdd,
}: {
  columnId: string
  cellValue: unknown
  hasRow: boolean
  onAdd: (filter: ActiveFilter) => void
}) {
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        Filter
      </ContextMenuSubTrigger>
      <ContextMenuSubContent>
        {SQL_FILTERS_GROUPED.map(({ group, filters }, index) => (
          <Fragment key={group}>
            {index > 0 && <ContextMenuSeparator />}
            <ContextMenuLabel>
              {FILTER_GROUPS[group]}
            </ContextMenuLabel>
            {filters.map(filter => (
              <ContextMenuItem
                key={filter.operator}
                disabled={isDisabled(filter, hasRow, cellValue)}
                onClick={() => {
                  onAdd({
                    column: columnId,
                    ref: filter,
                    values: cellToFilterValues(filter, cellValue),
                  })
                  toast.success('Filter added')
                }}
              >
                {filter.label}
                <span className="ml-auto pl-2 text-xs text-muted-foreground">{filter.operator}</span>
              </ContextMenuItem>
            ))}
          </Fragment>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}

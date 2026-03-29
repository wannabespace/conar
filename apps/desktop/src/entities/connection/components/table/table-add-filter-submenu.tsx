import type { ActiveFilter, Filter } from '@conar/shared/filters'
import { cellToFilterValues, FILTER_GROUPS, formatFilterPreview, SQL_FILTERS_GROUPED } from '@conar/shared/filters'
import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@conar/ui/components/context-menu'
import { cn } from '@conar/ui/lib/utils'
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
        Add filter
      </ContextMenuSubTrigger>
      <ContextMenuSubContent
        className={cn(`
          max-h-[min(70vh,22rem)] max-w-[min(100vw-2rem,32rem)] min-w-[16rem]
          overflow-y-auto
        `)}
      >
        {SQL_FILTERS_GROUPED.map(({ group, filters }, index) => (
          <Fragment key={group}>
            {index > 0 && <ContextMenuSeparator />}
            <ContextMenuGroup>
              <ContextMenuLabel>
                {FILTER_GROUPS[group]}
              </ContextMenuLabel>
              {filters.map((filter) => {
                const disabled = isDisabled(filter, hasRow, cellValue)
                const preview = formatFilterPreview(filter, cellValue)

                return (
                  <ContextMenuItem
                    key={filter.operator}
                    disabled={disabled}
                    className="min-w-0"
                    onClick={() => {
                      if (disabled)
                        return
                      onAdd({
                        column: columnId,
                        ref: filter,
                        values: cellToFilterValues(filter, cellValue),
                      })
                      toast.success('Filter added')
                    }}
                  >
                    <span
                      className="
                        flex w-full max-w-full min-w-0 items-center gap-2
                        font-mono text-xs
                      "
                      title={[columnId, filter.operator, preview].filter(Boolean).join(' ')}
                    >
                      <span className="shrink-0 font-medium text-primary">
                        {columnId}
                      </span>
                      <span aria-hidden className="h-3 w-px shrink-0 bg-border" />
                      <span className="shrink-0 text-muted-foreground">
                        {filter.operator}
                      </span>
                      {preview != null && (
                        <>
                          <span
                            aria-hidden
                            className="h-3 w-px shrink-0 bg-border"
                          />
                          <span className="
                            min-w-0 flex-1 truncate text-foreground
                          "
                          >
                            {preview}
                          </span>
                        </>
                      )}
                    </span>
                  </ContextMenuItem>
                )
              })}
            </ContextMenuGroup>
          </Fragment>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}

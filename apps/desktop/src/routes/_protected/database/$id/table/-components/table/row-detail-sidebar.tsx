import type { Column } from '~/entities/connection/components/table/utils'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiSidebarFoldLine, RiSideBarLine } from '@remixicon/react'
import { getEditableValue } from '~/entities/connection/components/table/utils'

export function RowDetailSidebar({
  row,
  columns,
  onClose,
  onExpand,
  onCollapse,
  isCollapsed,
  className,
}: {
  row: Record<string, unknown>
  columns: Column[]
  onClose: VoidFunction
  onExpand?: VoidFunction
  onCollapse?: VoidFunction
  isCollapsed?: boolean
  className?: string
}) {
  if (isCollapsed) {
    return (
      <aside
        className={cn(
          'flex w-12 shrink-0 flex-col items-center gap-1 border-l border-border bg-background py-2',
          className,
        )}
        aria-label="Row details (collapsed)"
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onExpand}
          aria-label="Expand row details"
        >
          <RiSideBarLine className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onClose}
          aria-label="Close row details"
        >
          <RiCloseLine className="size-4" />
        </Button>
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        'flex min-w-0 w-full shrink-0 flex-col border-l border-border bg-background',
        className,
      )}
      aria-label="Row details"
    >
      <div className="
        flex shrink-0 items-center justify-between border-b border-border px-3
        py-2
      "
      >
        <span className="text-sm font-medium text-muted-foreground">
          Row details
        </span>
        <div className="flex items-center gap-1">
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onCollapse}
              aria-label="Collapse row details"
            >
              <RiSidebarFoldLine className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
            aria-label="Close row details"
          >
            <RiCloseLine className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <dl className="divide-y divide-border">
          {columns.map((column) => {
            const rowValue = row[column.id]
            const isEmpty = rowValue === ''
            const isNull = rowValue === null || rowValue === undefined
            const displayValue = isNull
              ? 'null'
              : isEmpty
                ? 'empty'
                : getEditableValue({
                    value: rowValue,
                    oneLine: false,
                    column,
                  })
            const isPlaceholder = isNull || isEmpty

            return (
              <div key={column.id} className="px-3 py-2">
                <dt className="
                  truncate text-xs font-medium text-muted-foreground
                "
                >
                  {column.id}
                  {column.label && column.label !== column.id && (
                    <span className="ml-1 font-normal opacity-80">
                      (
                      {column.label}
                      )
                    </span>
                  )}
                  {column.primaryKey && (
                    <span className="ml-1 text-primary">PK</span>
                  )}
                  {column.foreign && (
                    <span className="ml-1 text-secondary-foreground">FK</span>
                  )}
                  {column.unique && (
                    <span className="ml-1 text-primary">UQ</span>
                  )}
                  {column.isNullable && (
                    <span className="ml-1 text-secondary-foreground">NULLABLE</span>
                  )}
                  {column.enum && (
                    <span className="rounded-xl ml-1 text-secondary-foreground p-2 bg-secondary">Enum</span>
                  )}
                  {column.maxLength && (
                    <span className="ml-1 text-primary">
                      (MAX
                      {' '}
                      {column.maxLength}
                      )
                    </span>
                  )}
                </dt>

                <dd
                  className={cn(
                    'mt-0.5 font-mono text-sm whitespace-pre-wrap break-words',
                    isPlaceholder && 'text-muted-foreground italic',
                  )}
                >
                  {displayValue}
                </dd>
              </div>
            )
          })}
        </dl>
      </ScrollArea>
    </aside>
  )
}

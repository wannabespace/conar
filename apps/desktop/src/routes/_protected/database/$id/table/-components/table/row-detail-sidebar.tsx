import type { Column } from '~/entities/connection/components/table/utils'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine } from '@remixicon/react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { getEditableValue } from '~/entities/connection/components/table/utils'

export function RowDetailSidebar({
  row,
  columns,
  onClose,
  className,
}: {
  row: Record<string, unknown>
  columns: Column[]
  onClose: VoidFunction
  className?: string
}) {
  useHotkey('Escape', onClose)

  return (
    <aside
      className={cn(
        'flex w-80 shrink-0 flex-col border-l border-border bg-background',
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

      <ScrollArea className="flex-1">
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
                  {column.enum && (
                    <span className="ml-1 text-secondary-foreground">Enum</span>
                  )}
                </dt>

                <dd
                  className={cn(
                    'mt-0.5 font-mono text-sm wrap-break-word',
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

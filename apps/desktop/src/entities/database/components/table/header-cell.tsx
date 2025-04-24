import type { Header } from '@tanstack/react-table'
import type { CellMeta } from './cell'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiKey2Line } from '@remixicon/react'

export function HeaderCell<T extends Record<string, unknown>>({ header }: { header: Header<T, unknown> }) {
  const meta = header.column.columnDef.meta as CellMeta

  return (
    <div
      key={header.id}
      style={{ width: `${header.getSize()}px` }}
      className="shrink-0 text-xs p-2 group-first/header:pl-4 group-last/header:pr-4"
    >
      {header.isPlaceholder
        ? null
        : (
            <div
              className={header.column.getCanSort()
                ? 'cursor-pointer select-none'
                : ''}
              onClick={header.column.getToggleSortingHandler()}
            >
              <div
                data-mask
                className="truncate font-medium flex items-center gap-1"
              >
                {meta.isPrimaryKey && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <RiKey2Line className="size-3 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>Primary key</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {meta.name}
              </div>
              {meta.type && (
                <div data-type={meta.type} className="text-muted-foreground truncate font-mono">
                  {meta.type}
                </div>
              )}
            </div>
          )}
    </div>
  )
}

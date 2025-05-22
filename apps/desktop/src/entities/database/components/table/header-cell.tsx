import type { ColumnRenderer } from '.'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { cn } from '@connnect/ui/lib/utils'
import { RiBookOpenLine, RiEraserLine, RiKey2Line } from '@remixicon/react'

export function HeaderCell({ column, index }: { column: ColumnRenderer, index: number }) {
  return (
    <div
      className={cn(
        'shrink-0 text-xs p-2',
        index === 0 && 'pl-4',
      )}
    >
      {/* TODO: add sortable */}
      <div
        className={false
          ? 'cursor-pointer select-none'
          : ''}
        onClick={() => {}}
      >
        <div
          data-mask
          className="truncate font-medium flex items-center gap-1"
          title={column.id}
        >
          {column.id}
        </div>
        {column.meta?.type && (
          <div data-type={column.meta.type} className="flex items-center gap-1">
            {column.meta.isPrimaryKey && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiKey2Line className="size-3 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>Primary key</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {column.meta.isNullable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiEraserLine className="size-3 opacity-30" />
                  </TooltipTrigger>
                  <TooltipContent>Nullable</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {column.meta.isEditable === false && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiBookOpenLine className="size-3 opacity-30" />
                  </TooltipTrigger>
                  <TooltipContent>Read only</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className="text-muted-foreground truncate font-mono">
              {column.meta.type}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

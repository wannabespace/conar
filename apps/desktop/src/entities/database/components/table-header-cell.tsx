import type { Column } from '../table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { cn } from '@connnect/ui/lib/utils'
import { RiBookOpenLine, RiEraserLine, RiKey2Line } from '@remixicon/react'

export function TableHeaderCell({ column, columnIndex }: { column: Column, columnIndex: number }) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between shrink-0 p-2',
        columnIndex === 0 && 'pl-4',
      )}
    >
      <div className="text-xs">
        <div
          data-mask
          className="truncate font-medium flex items-center gap-1"
          title={column.name}
        >
          {column.name}
        </div>
        {column?.type && (
          <div data-type={column.type} className="flex items-center gap-1">
            {column.isPrimaryKey && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiKey2Line className="size-3 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>Primary key</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {column.isNullable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiEraserLine className="size-3 opacity-30" />
                  </TooltipTrigger>
                  <TooltipContent>Nullable</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {column.isEditable === false && (
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
              {column.type}
            </span>
          </div>
        )}
      </div>
      <div>
        123
      </div>
    </div>
  )
}

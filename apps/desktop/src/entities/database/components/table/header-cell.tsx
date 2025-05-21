import type { ColumnRenderer } from '.'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiBookOpenLine, RiEraserLine, RiKey2Line } from '@remixicon/react'

export function HeaderCell({ column }: { column: ColumnRenderer }) {
  return (
    <div
      className="shrink-0 text-xs p-2 group-data-[column-index='0']/header:pl-4"
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
        >
          {column.name}
        </div>
        {column.meta?.type && (
          <div className="flex items-center gap-1">
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
            <div data-type={column.meta.type} className="text-muted-foreground truncate font-mono">
              {column.meta.type}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

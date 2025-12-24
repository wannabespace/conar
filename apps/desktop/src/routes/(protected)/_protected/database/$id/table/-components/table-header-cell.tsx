import type { TableHeaderCellProps } from '~/components/table'
import type { Column } from '~/entities/database'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine, RiArrowUpDownLine, RiArrowUpLine, RiBookOpenLine, RiEraserLine, RiFingerprintLine, RiKey2Line, RiLinksLine, RiPencilLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { databaseEnumsQuery } from '~/entities/database'
import { Route } from '..'
import { usePageStoreContext } from '../-store'

const CANNOT_SORT_TYPES = ['json']

function SortButton({ order, onClick }: { order: 'ASC' | 'DESC' | null, onClick: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClick}
            className={cn(order !== null && 'text-primary')}
          >
            {order === 'ASC'
              ? (
                  <RiArrowUpLine className="size-3" />
                )
              : order === 'DESC'
                ? (
                    <RiArrowDownLine className="size-3" />
                  )
                : (
                    <RiArrowUpDownLine className="size-3 opacity-30" />
                  )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {order === null ? 'Sort' : order === 'ASC' ? 'Sort ascending' : 'Sort descending'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function TableHeaderCell({
  onSort,
  onRename,
  column,
  position,
  columnIndex,
  className,
  style,
}: {
  column: Column
  onSort?: () => void
  onRename?: () => void
  className?: string
} & TableHeaderCellProps) {
  const { database } = Route.useLoaderData()
  const store = usePageStoreContext()
  const order = useStore(store, state => state.orderBy?.[column.id] ?? null)
  const { data: enumData } = useQuery({
    ...databaseEnumsQuery({ database }),
    select: data => data?.find(e => e.name === column.enum),
  })

  return (
    <div
      className={cn(
        'flex w-full shrink-0 items-center justify-between p-2',
        position === 'first' && 'pl-4',
        position === 'last' && 'pr-4',
        className,
      )}
      style={style}
      data-position={position}
      data-index={columnIndex}
      data-column-id={column.id}
    >
      <div className="overflow-hidden text-xs">
        <div
          data-mask
          className={`
            group/header-cell flex items-center gap-1 truncate font-medium
          `}
          title={column.id}
        >
          {column.id}
          {onRename && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onRename}
              className="size-5 transition-opacity"
            >
              <RiPencilLine className="size-3 text-muted-foreground" />
            </Button>
          )}
        </div>
        {column?.type && (
          <div data-footer={!!column.type} className="flex items-center gap-1">
            {column.primaryKey && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiKey2Line className="size-3 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="mb-1 flex items-center gap-1">
                      <RiKey2Line className="size-3 text-primary" />
                      <span>Primary key</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {column.primaryKey}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {column.isNullable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiEraserLine className="size-3 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1">
                      <RiEraserLine className="size-3 text-muted-foreground/70" />
                      <span>Nullable</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {column.unique && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiFingerprintLine className={`
                      size-3 text-muted-foreground/70
                    `}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="mb-1 flex items-center gap-1">
                      <RiFingerprintLine className={`
                        size-3 text-muted-foreground/70
                      `}
                      />
                      <span>Unique</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {column.unique}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {column.isEditable === false && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiBookOpenLine className="size-3 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1">
                      <RiBookOpenLine className={`
                        size-3 text-muted-foreground/70
                      `}
                      />
                      <span>Read only</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {column.foreign && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <RiLinksLine className="size-3 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1">
                      <RiLinksLine className="size-3 text-muted-foreground/70" />
                      <span>Foreign key</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {column.foreign.name}
                      {' '}
                      (
                      {column.foreign.table}
                      .
                      {column.foreign.column}
                      )
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {enumData
              ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`
                          truncate font-mono text-muted-foreground underline
                          decoration-dotted
                        `}
                        >
                          {column.type}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs text-muted-foreground">
                          Available values:
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {enumData.values.map((val: string) => (
                            <Badge
                              key={val}
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {val}
                            </Badge>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              : (
                  <span className="truncate font-mono text-muted-foreground">
                    {column.type}
                  </span>
                )}
          </div>
        )}
      </div>
      {onSort && column.type && !CANNOT_SORT_TYPES.includes(column.type) && (
        <SortButton order={order} onClick={onSort} />
      )}
    </div>
  )
}

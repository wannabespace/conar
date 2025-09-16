import type { TableHeaderCellProps } from '~/components/table'
import type { Column } from '~/entities/database/table'
import { Button } from '@conar/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine, RiArrowUpDownLine, RiArrowUpLine, RiBookOpenLine, RiEraserLine, RiFingerprintLine, RiKey2Line } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { usePageStoreContext } from '../-store'

type SortOrder = 'ASC' | 'DESC'

const CANNOT_SORT_TYPES = ['json']

function SortButton({ column }: { column: Column }) {
  const store = usePageStoreContext()
  const order = useStore(store, state => state.orderBy?.[column.id] ?? null)

  if (column.type && CANNOT_SORT_TYPES.includes(column.type))
    return null

  function setOrder(order: SortOrder) {
    store.setState(state => ({
      ...state,
      orderBy: {
        ...state.orderBy,
        [column.id]: order,
      },
    }))
  }

  function removeOrder() {
    const newOrderBy = { ...store.state.orderBy }

    delete newOrderBy[column.id]

    store.setState(state => ({
      ...state,
      orderBy: newOrderBy,
    }))
  }

  const handleClick = () => {
    switch (order) {
      case null:
        setOrder('ASC')
        break
      case 'ASC':
        setOrder('DESC')
        break
      case 'DESC':
        removeOrder()
        break
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleClick}
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

export function TableHeaderCell({ column, isFirst, isLast, columnIndex, className, style }: { column: Column } & TableHeaderCellProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between shrink-0 p-2',
        isFirst && 'pl-4',
        isLast && 'pr-4',
        className,
      )}
      style={style}
      data-last={isLast}
      data-first={isFirst}
      data-index={columnIndex}
      data-column-id={column.id}
    >
      <div className="text-xs overflow-hidden">
        <div
          data-mask
          className="truncate font-medium flex items-center gap-1"
          title={column.id}
        >
          {column.id}
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
                    <div className="flex items-center gap-1 mb-1">
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
                    <RiFingerprintLine className="size-3 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1 mb-1">
                      <RiFingerprintLine className="size-3 text-muted-foreground/70" />
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
                      <RiBookOpenLine className="size-3 text-muted-foreground/70" />
                      <span>Read only</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className="text-muted-foreground truncate font-mono">
              {column.type}
            </span>
          </div>
        )}
      </div>
      <SortButton column={column} />
    </div>
  )
}

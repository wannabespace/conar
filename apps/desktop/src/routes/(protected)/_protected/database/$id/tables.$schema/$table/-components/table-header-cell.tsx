import type { TableHeaderCellProps } from '~/components/table'
import type { Column } from '~/entities/database/table'
import { Button } from '@connnect/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { cn } from '@connnect/ui/lib/utils'
import { RiArrowDownLine, RiArrowUpDownLine, RiArrowUpLine, RiBookOpenLine, RiEraserLine, RiKey2Line } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { usePageContext } from '..'

type SortOrder = 'ASC' | 'DESC'

const CANNOT_SORT_TYPES = ['json']

function SortButton({ column }: { column: Column }) {
  const { store } = usePageContext()
  const order = useStore(store, state => state.orderBy?.[column.name] ?? null)

  if (column.type && CANNOT_SORT_TYPES.includes(column.type))
    return null

  function setOrder(order: SortOrder) {
    store.setState(state => ({
      ...state,
      orderBy: {
        ...state.orderBy,
        [column.name]: order,
      },
    }))
  }

  function removeOrder() {
    const newOrderBy = { ...store.state.orderBy }

    delete newOrderBy[column.name]

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
            size="iconXs"
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

export function TableHeaderCell({ column, isFirst, isLast, className, style }: { column: Column } & TableHeaderCellProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between shrink-0 p-2',
        isFirst && 'pl-4',
        isLast && 'pr-4',
        className,
      )}
      style={style}
    >
      <div className="text-xs overflow-hidden">
        <div
          data-mask
          className="truncate font-medium flex items-center gap-1"
          title={column.name}
        >
          {column.name}
        </div>
        {column?.type && (
          <div data-footer={!!column.type} className="flex items-center gap-1">
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
      <SortButton column={column} />
    </div>
  )
}

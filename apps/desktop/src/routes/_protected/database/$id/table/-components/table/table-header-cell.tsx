import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { storeState } from '../../-store'
import type { TableHeaderCellProps } from '~/components/table'
import type { Column } from '~/entities/connection/components/table/utils'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine, RiArrowUpDownLine, RiArrowUpLine, RiBookOpenLine, RiEraserLine, RiFingerprintLine, RiKey2Line, RiLinksLine, RiPencilLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTableContext } from '~/components/table'
import { connectionEnumsQuery } from '~/entities/connection/queries'
import { Route } from '../..'
import { usePageStoreContext } from '../../-store'

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
                  <RiArrowUpLine className="size-3 shrink-0" />
                )
              : order === 'DESC'
                ? (
                    <RiArrowDownLine className="size-3 shrink-0" />
                  )
                : (
                    <RiArrowUpDownLine className="size-3 shrink-0 opacity-30" />
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

function PrimaryKeyBadge({ primaryKey }: { primaryKey: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiKey2Line className="size-3 shrink-0 text-primary" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="mb-1 flex items-center gap-1">
            <RiKey2Line className="size-3 text-primary" />
            Primary key
          </div>
          <div className="text-xs text-muted-foreground">
            {primaryKey}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function NullableBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiEraserLine className="size-3 shrink-0 text-muted-foreground/70" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-1">
            <RiEraserLine className="size-3 text-muted-foreground/70" />
            Nullable
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function UniqueBadge({ unique }: { unique: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiFingerprintLine className="
            size-3 shrink-0 text-muted-foreground/70
          "
          />
        </TooltipTrigger>
        <TooltipContent>
          <div className="mb-1 flex items-center gap-1">
            <RiFingerprintLine className="size-3 text-muted-foreground/70" />
            Unique
          </div>
          <div className="text-xs text-muted-foreground">
            {unique}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ReadOnlyBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiBookOpenLine className="size-3 shrink-0 text-muted-foreground/70" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-1">
            <RiBookOpenLine className="size-3 text-muted-foreground/70" />
            Read only
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

  )
}

function ForeignBadge({ name, table, column }: { name: string, table: string, column: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiLinksLine className="size-3 shrink-0 text-muted-foreground/70" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-1">
            <RiLinksLine className="size-3 text-muted-foreground/70" />
            Foreign key
          </div>
          <div className="text-xs text-muted-foreground">
            {name}
            {' '}
            (
            {table}
            .
            {column}
            )
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function EnumBadge({ values, children }: { values: string[], children: ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs text-muted-foreground">
            Available values:
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {values.map((val: string) => (
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
}

const resizeOverlay = document.createElement('div')
resizeOverlay.className = 'cursor-col-resize size-full fixed top-0 left-0 z-1000'

export function TableHeaderCell({
  resize,
  onSort,
  onRename,
  column,
  position,
  columnIndex,
  className,
  style,
}: {
  resize?: boolean
  column: Column
  onSort?: () => void
  onRename?: () => void
  className?: string
} & TableHeaderCellProps) {
  const { connection } = Route.useLoaderData()
  const store = usePageStoreContext()
  const [isResizing, setIsResizing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const order = useStore(store, state => state.orderBy?.[column.id] ?? null)
  const { data: enumsData } = useQuery({
    ...connectionEnumsQuery({ connection }),
    select: data => data?.find(e => e.name === column.enum),
  })
  const scrollRef = useTableContext(state => state.scrollRef)

  const handleResize = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsResizing(true)
    const startWidth = ref.current?.getBoundingClientRect().width ?? 0

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!scrollRef?.current) {
        return
      }
      if (!resizeOverlay.parentElement) {
        document.body.appendChild(resizeOverlay)
      }
      const newWidth = Math.max(100, startWidth + (moveEvent.clientX - e.clientX))
      store.setState(state => ({
        ...state,
        columnSizes: {
          ...state.columnSizes,
          [column.id]: newWidth,
        },
      } satisfies typeof storeState.infer))
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      setIsResizing(false)
      if (resizeOverlay.parentElement) {
        document.body.removeChild(resizeOverlay)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const removeSize = () => {
    const newColumnSizes = { ...store.state.columnSizes }
    delete newColumnSizes[column.id]
    store.setState(state => ({
      ...state,
      columnSizes: newColumnSizes,
    } satisfies typeof storeState.infer))
  }

  return (
    <div
      ref={ref}
      className={cn(
        `
          group/header-cell relative flex w-full shrink-0 items-center
          justify-between p-2
        `,
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
          className="flex items-center gap-1 truncate font-medium"
          title={column.id}
        >
          {column.id}
          {onRename && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onRename}
              className={`
                size-5 opacity-0 transition-opacity
                group-hover/header-cell:opacity-100
              `}
            >
              <RiPencilLine className="size-3 text-muted-foreground" />
            </Button>
          )}
        </div>
        {column?.label && (
          <div data-footer={!!column.label} className="flex items-center gap-1">
            {column.primaryKey && <PrimaryKeyBadge primaryKey={column.primaryKey} />}
            {column.isNullable && <NullableBadge />}
            {column.unique && <UniqueBadge unique={column.unique} />}
            {column.isEditable === false && <ReadOnlyBadge />}
            {column.foreign && (
              <ForeignBadge
                name={column.foreign.name}
                table={column.foreign.table}
                column={column.foreign.column}
              />
            )}
            {enumsData
              ? (
                  <EnumBadge values={enumsData.values}>
                    <span className={`
                      truncate font-mono text-muted-foreground underline
                      decoration-dotted
                    `}
                    >
                      {column.label}
                    </span>
                  </EnumBadge>
                )
              : (
                  <span className="truncate font-mono text-muted-foreground">
                    {column.label}
                  </span>
                )}
          </div>
        )}
      </div>
      <div className="flex h-full items-center gap-1">
        {onSort && column.label && !CANNOT_SORT_TYPES.includes(column.label) && (
          <SortButton order={order} onClick={onSort} />
        )}
        {resize !== false && (
          <div
            className={cn(`
              h-full w-1 cursor-col-resize rounded-xs bg-foreground/20 opacity-0
              transition-opacity select-none
              group-hover/header-cell:opacity-100
              hover:bg-primary
            `, isResizing && `bg-primary! opacity-100!`)}
            onDoubleClick={removeSize}
            onMouseDown={handleResize}
          />
        )}
      </div>
    </div>
  )
}

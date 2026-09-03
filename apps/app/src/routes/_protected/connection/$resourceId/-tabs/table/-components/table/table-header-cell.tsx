import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiBookOpenLine,
  RiCharacterRecognitionLine,
  RiCloseLine,
  RiEraserLine,
  RiEyeOffLine,
  RiFileCopyLine,
  RiFingerprintLine,
  RiKey2Line,
  RiLinksLine,
  RiPencilLine,
  RiExpandLeftRightLine,
} from '@remixicon/react'
import type { TableHeaderCellProps } from '@tamery/table'
import { useTableContext } from '@tamery/table/hooks'
import { ResizeHandle } from '@tamery/ui/components/custom/resize-handle'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { copy as copyToClipboard } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'
import type {
  Column,
  ColumnHandlers,
} from '~/entities/connection/components/table/cell'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries'

import type { tablePageType } from '../../-lib/store'
import { useTablePageStore } from '../../-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const CANNOT_SORT_TYPES = new Set(['json'])

export const PrimaryKeyTooltipIcon = ({
  primaryKey,
}: {
  primaryKey: string
}) => (
  <Tooltip>
    <TooltipTrigger>
      <RiKey2Line className="text-primary size-2.5 shrink-0" />
    </TooltipTrigger>
    <TooltipContent className="max-w-none flex-col items-start gap-0.5">
      <div className="flex items-center gap-1">
        <RiKey2Line className="text-primary size-3" />
        Primary key
      </div>
      <div data-mask className="text-xs opacity-70">
        {primaryKey}
      </div>
    </TooltipContent>
  </Tooltip>
)

export const NullableTooltipIcon = () => (
  <Tooltip>
    <TooltipTrigger
      render={<RiEraserLine className="size-2.5 shrink-0 opacity-70" />}
    />
    <TooltipContent>
      <div className="flex items-center gap-1">
        <RiEraserLine className="size-3 opacity-70" />
        Nullable
      </div>
    </TooltipContent>
  </Tooltip>
)

export const UniqueTooltipIcon = ({ unique }: { unique: string }) => (
  <Tooltip>
    <TooltipTrigger>
      <RiFingerprintLine className="size-2.5 shrink-0 opacity-70" />
    </TooltipTrigger>
    <TooltipContent className="max-w-none flex-col items-start gap-0.5">
      <div className="flex items-center gap-1">
        <RiFingerprintLine className="size-3 opacity-70" />
        Unique
      </div>
      <div data-mask className="text-xs opacity-70">
        {unique}
      </div>
    </TooltipContent>
  </Tooltip>
)

export const ReadOnlyTooltipIcon = () => (
  <Tooltip>
    <TooltipTrigger>
      <RiBookOpenLine className="size-2.5 shrink-0 opacity-70" />
    </TooltipTrigger>
    <TooltipContent>
      <div className="flex items-center gap-1">
        <RiBookOpenLine className="size-3 opacity-70" />
        Read only
      </div>
    </TooltipContent>
  </Tooltip>
)

export const DefaultValueTooltipIcon = ({
  defaultValue,
}: {
  defaultValue: string
}) => (
  <Tooltip>
    <TooltipTrigger>
      <RiCharacterRecognitionLine className="size-2.5 shrink-0 opacity-70" />
    </TooltipTrigger>
    <TooltipContent className="max-w-none flex-col items-start gap-0.5">
      <div className="flex items-center gap-1">
        <RiCharacterRecognitionLine className="size-3 opacity-70" />
        Default
      </div>
      <div
        data-mask
        className="max-w-sm font-mono text-xs break-all opacity-70"
      >
        {defaultValue}
      </div>
    </TooltipContent>
  </Tooltip>
)

const ForeignTooltipIcon = ({
  name,
  table,
  column,
}: {
  name: string
  table: string
  column: string
}) => (
  <Tooltip>
    <TooltipTrigger
      render={<RiLinksLine className="size-2.5 shrink-0 opacity-70" />}
    />
    <TooltipContent className="max-w-none flex-col items-start gap-0.5">
      <div className="flex items-center gap-1">
        <RiLinksLine className="size-3 opacity-70" />
        Foreign key
      </div>
      <div data-mask className="text-xs opacity-70">
        {name} ({table}.{column})
      </div>
    </TooltipContent>
  </Tooltip>
)

const EnumTooltipIcon = ({
  values,
  children,
}: {
  values: string[]
  children: ReactNode
}) => (
  <Tooltip>
    <TooltipTrigger>{children}</TooltipTrigger>
    <TooltipContent className="flex-col items-start">
      <div className="text-xs opacity-70">Available values:</div>
      <div
        data-mask
        className="flex max-w-sm flex-wrap gap-1 font-mono text-xs font-medium"
      >
        {values.join(', ')}
      </div>
    </TooltipContent>
  </Tooltip>
)

const buildSortMenuItems = (
  order: 'ASC' | 'DESC' | null,
  onOrder: (order: 'ASC' | 'DESC' | null) => void
): AppMenuNode[] => {
  const items: AppMenuNode[] = [
    {
      checked: order === 'ASC' ? true : undefined,
      className: cn(order === 'ASC' && 'text-primary'),
      icon: (
        <RiArrowUpLine
          className={cn('size-4', order === 'ASC' && 'text-primary')}
        />
      ),
      label: 'Sort Ascending',
      onSelect: () => (order === 'ASC' ? onOrder(null) : onOrder('ASC')),
    },
    {
      checked: order === 'DESC' ? true : undefined,
      className: cn(order === 'DESC' && 'text-primary'),
      icon: (
        <RiArrowDownLine
          className={cn('size-4', order === 'DESC' && 'text-primary')}
        />
      ),
      label: 'Sort Descending',
      onSelect: () => (order === 'DESC' ? onOrder(null) : onOrder('DESC')),
    },
  ]

  if (order !== null) {
    items.push({
      icon: <RiCloseLine className="size-4" />,
      label: 'Clear Sort',
      onSelect: () => onOrder(null),
    })
  }

  items.push({ type: 'separator' })
  return items
}

const buildHeaderMenuItems = ({
  columnId,
  hasCustomSize,
  isSortable,
  onOrder,
  onRename,
  onResize,
  order,
  onHideColumn,
  onRemoveSize,
}: {
  columnId: string
  hasCustomSize: boolean
  isSortable: boolean
  onOrder?: (order: 'ASC' | 'DESC' | null) => void
  onRename?: () => void
  onResize?: (width: number) => void
  order: 'ASC' | 'DESC' | null
  onHideColumn: () => void
  onRemoveSize: () => void
}): AppMenuNode[] => {
  const items: AppMenuNode[] = []

  if (isSortable && onOrder) {
    items.push(...buildSortMenuItems(order, onOrder))
  }

  if (onRename) {
    items.push({
      icon: <RiPencilLine className="size-4" />,
      label: 'Rename Column',
      onSelect: onRename,
    })
  }

  items.push(
    {
      icon: <RiFileCopyLine className="size-4" />,
      label: 'Copy Name',
      onSelect: () => copyToClipboard(columnId, 'Column name copied'),
    },
    { type: 'separator' },
    {
      icon: <RiEyeOffLine className="size-4" />,
      label: 'Hide Column',
      onSelect: onHideColumn,
    }
  )

  if (hasCustomSize && onResize) {
    items.push({
      icon: <RiExpandLeftRightLine className="size-4" />,
      label: 'Reset Width',
      onSelect: onRemoveSize,
    })
  }

  return items
}

export const TableHeaderCell = ({
  column,
  position,
  columnIndex,
  className,
  style,
  onOrder,
  onRename,
  onResize,
}: {
  column: Column
  className?: string
} & TableHeaderCellProps &
  ColumnHandlers) => {
  const { connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const ref = useRef<HTMLDivElement>(null)
  const order = useSubscription(store, {
    selector: (state) => state.orderBy?.[column.id] ?? null,
  })
  const hasCustomSize = useSubscription(store, {
    selector: (state) => state.columnSizes[column.id] !== undefined,
  })
  const { data: enumsData } = useQuery({
    ...resourceEnumsQueryOptions({ connectionResource }),
    select: (data) => data?.find((e) => e.name === column.enumName),
  })
  const scrollRef = useTableContext((state) => state.scrollRef)

  const isSortable =
    !!onOrder && !!column.typeLabel && !CANNOT_SORT_TYPES.has(column.typeLabel)

  const hideColumn = () => {
    store.set(
      (state) =>
        ({
          ...state,
          hiddenColumns: [...state.hiddenColumns, column.id],
        }) satisfies typeof state
    )
  }

  const removeSize = () => {
    store.set((state) => {
      const columnSizes = Object.fromEntries(
        Object.entries(state.columnSizes).filter(([id]) => id !== column.id)
      )
      return {
        ...state,
        columnSizes,
      } satisfies typeof tablePageType.infer
    })
  }

  const items = buildHeaderMenuItems({
    columnId: column.id,
    hasCustomSize,
    isSortable,
    onHideColumn: hideColumn,
    onOrder,
    onRemoveSize: removeSize,
    onRename,
    onResize,
    order,
  })

  return (
    <AppContextMenu
      items={items}
      contentProps={{ side: 'bottom', align: 'start', className: 'min-w-52' }}
      render={
        <div
          ref={ref}
          aria-label={`${column.id} column options`}
          className={cn(
            `group/header-cell relative flex w-full shrink-0 cursor-default items-center justify-between px-2 py-1.5 outline-none`,
            position === 'first' && 'pl-4',
            position === 'last' && 'pr-4',
            order !== null && 'bg-foreground/4',
            className
          )}
          style={style}
          data-position={position}
          data-index={columnIndex}
          data-column-id={column.id}
        />
      }
    >
      <div className="overflow-hidden text-xs">
        <div
          data-mask
          className="flex items-center gap-1 truncate font-medium"
          title={column.id}
        >
          {column.id}
        </div>
        {column?.typeLabel && (
          <div
            data-footer={!!column.typeLabel}
            className="text-2xs flex items-center gap-0.5 leading-4"
          >
            {column.primaryKey && (
              <PrimaryKeyTooltipIcon primaryKey={column.primaryKey} />
            )}
            {column.isNullable && <NullableTooltipIcon />}
            {column.unique && <UniqueTooltipIcon unique={column.unique} />}
            {column.isEditable === false && <ReadOnlyTooltipIcon />}
            {column.foreign && (
              <ForeignTooltipIcon
                name={column.foreign.name}
                table={column.foreign.table}
                column={column.foreign.column}
              />
            )}
            {column.defaultValue && (
              <DefaultValueTooltipIcon defaultValue={column.defaultValue} />
            )}
            {enumsData ? (
              <EnumTooltipIcon values={enumsData.values}>
                <span className="text-muted-foreground truncate font-mono underline decoration-dotted">
                  {column.typeLabel}
                </span>
              </EnumTooltipIcon>
            ) : (
              <span className="text-muted-foreground truncate font-mono">
                {column.typeLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-stretch">
        {order !== null && (
          <span className="text-primary flex size-4 items-center justify-center">
            {order === 'ASC' ? (
              <RiArrowUpLine className="size-3 shrink-0" />
            ) : (
              <RiArrowDownLine className="size-3 shrink-0" />
            )}
          </span>
        )}
        {onResize && (
          <ResizeHandle
            aria-label="Resize column"
            min={100}
            getValue={() => ref.current?.getBoundingClientRect().width ?? 0}
            onResize={(width) => {
              if (!scrollRef?.current) {
                return
              }
              onResize(width)
            }}
            className="flex items-stretch self-stretch p-1"
            onDoubleClick={removeSize}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="bg-foreground/20 group-hover/resize-handle:bg-primary group-data-resizing/resize-handle:bg-primary! w-0.5 rounded-full opacity-0 transition-opacity group-hover/header-cell:opacity-100 group-data-resizing/resize-handle:opacity-100!" />
          </ResizeHandle>
        )}
      </div>
    </AppContextMenu>
  )
}

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { copy as copyToClipboard } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'
import type { Column, ColumnHandlers } from '~/entities/connection/components/table/cell'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries'

import type { tablePageType } from '../../-lib/store'
import { useTablePageStore } from '../../-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const CANNOT_SORT_TYPES = new Set(['json'])

export function PrimaryKeyTooltipIcon({ primaryKey }: { primaryKey: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <RiKey2Line className="size-2.5 shrink-0 text-primary" />
      </TooltipTrigger>
      <TooltipContent className="max-w-none">
        <div className="flex items-center gap-1">
          <RiKey2Line className="size-3 text-primary" />
          Primary key
        </div>
        <div data-mask className="text-xs opacity-70">
          {primaryKey}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function NullableTooltipIcon() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<RiEraserLine className="size-2.5 shrink-0 opacity-70" />}
      ></TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-1">
          <RiEraserLine className="size-3 opacity-70" />
          Nullable
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function UniqueTooltipIcon({ unique }: { unique: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <RiFingerprintLine className="size-2.5 shrink-0 opacity-70" />
      </TooltipTrigger>
      <TooltipContent className="max-w-none">
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
}

export function ReadOnlyTooltipIcon() {
  return (
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
}

export function DefaultValueTooltipIcon({ defaultValue }: { defaultValue: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <RiCharacterRecognitionLine className="size-2.5 shrink-0 opacity-70" />
      </TooltipTrigger>
      <TooltipContent className="max-w-none">
        <div className="flex items-center gap-1">
          <RiCharacterRecognitionLine className="size-3 opacity-70" />
          Default
        </div>
        <div data-mask className="max-w-sm font-mono text-xs break-all opacity-70">
          {defaultValue}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function ForeignTooltipIcon({
  name,
  table,
  column,
}: {
  name: string
  table: string
  column: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<RiLinksLine className="size-2.5 shrink-0 opacity-70" />}
      ></TooltipTrigger>
      <TooltipContent className="max-w-none">
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
}

function EnumTooltipIcon({ values, children }: { values: string[]; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>
        <div className="mb-1 text-xs opacity-70">Available values:</div>
        <div
          data-mask
          className="
          flex max-w-sm flex-wrap gap-1 font-mono text-xs font-medium
        "
        >
          {values.join(', ')}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

const resizeOverlay = document.createElement('div')
resizeOverlay.className = 'cursor-col-resize size-full fixed top-0 left-0 z-1000'

export function TableHeaderCell({
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
  ColumnHandlers) {
  const { connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const [isResizing, setIsResizing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const order = useSubscription(store, { selector: state => state.orderBy?.[column.id] ?? null })
  const hasCustomSize = useSubscription(store, {
    selector: state => state.columnSizes[column.id] !== undefined,
  })
  const { data: enumsData } = useQuery({
    ...resourceEnumsQueryOptions({ connectionResource }),
    select: data => data?.find(e => e.name === column.enumName),
  })
  const scrollRef = useTableContext(state => state.scrollRef)

  const isSortable = !!onOrder && !!column.typeLabel && !CANNOT_SORT_TYPES.has(column.typeLabel)

  const hideColumn = () => {
    store.set(
      state =>
        ({
          ...state,
          hiddenColumns: [...state.hiddenColumns, column.id],
        }) satisfies typeof state,
    )
  }

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
      onResize?.(newWidth)
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
    store.set(state => {
      const newColumnSizes = { ...state.columnSizes }
      delete newColumnSizes[column.id]
      return {
        ...state,
        columnSizes: newColumnSizes,
      } satisfies typeof tablePageType.infer
    })
  }

  const items: AppMenuNode[] = [
    ...(isSortable
      ? ([
          {
            label: 'Sort Ascending',
            icon: <RiArrowUpLine className={cn('size-4', order === 'ASC' && 'text-primary')} />,
            className: cn(order === 'ASC' && 'text-primary'),
            checked: order === 'ASC' ? true : undefined,
            onSelect: () => (order === 'ASC' ? onOrder?.(null) : onOrder?.('ASC')),
          },
          {
            label: 'Sort Descending',
            icon: <RiArrowDownLine className={cn('size-4', order === 'DESC' && 'text-primary')} />,
            className: cn(order === 'DESC' && 'text-primary'),
            checked: order === 'DESC' ? true : undefined,
            onSelect: () => (order === 'DESC' ? onOrder?.(null) : onOrder?.('DESC')),
          },
          ...(order !== null
            ? [
                {
                  label: 'Clear Sort',
                  icon: <RiCloseLine className="size-4" />,
                  onSelect: () => onOrder?.(null),
                },
              ]
            : []),
          { type: 'separator' },
        ] satisfies AppMenuNode[])
      : []),
    ...(onRename
      ? ([
          {
            label: 'Rename Column',
            icon: <RiPencilLine className="size-4" />,
            onSelect: onRename,
          },
        ] satisfies AppMenuNode[])
      : []),
    {
      label: 'Copy Name',
      icon: <RiFileCopyLine className="size-4" />,
      onSelect: () => copyToClipboard(column.id, 'Column name copied'),
    },
    { type: 'separator' },
    {
      label: 'Hide Column',
      icon: <RiEyeOffLine className="size-4" />,
      onSelect: hideColumn,
    },
    ...(hasCustomSize && onResize
      ? ([
          {
            label: 'Reset Width',
            icon: <RiExpandLeftRightLine className="size-4" />,
            onSelect: removeSize,
          },
        ] satisfies AppMenuNode[])
      : []),
  ]

  return (
    <AppContextMenu
      items={items}
      contentProps={{ side: 'bottom', align: 'start', className: 'min-w-52' }}
      render={
        <div
          ref={ref}
          aria-label={`${column.id} column options`}
          className={cn(
            `
              group/header-cell relative flex w-full shrink-0 cursor-default
              items-center justify-between px-2 py-1.5 outline-none
            `,
            position === 'first' && 'pl-4',
            position === 'last' && 'pr-4',
            className,
          )}
          style={style}
          data-position={position}
          data-index={columnIndex}
          data-column-id={column.id}
        />
      }
    >
      <div className="overflow-hidden text-xs">
        <div data-mask className="flex items-center gap-1 truncate font-medium" title={column.id}>
          {column.id}
        </div>
        {column?.typeLabel && (
          <div
            data-footer={!!column.typeLabel}
            className="flex items-center gap-0.5 text-2xs leading-4"
          >
            {column.primaryKey && <PrimaryKeyTooltipIcon primaryKey={column.primaryKey} />}
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
            {column.defaultValue && <DefaultValueTooltipIcon defaultValue={column.defaultValue} />}
            {enumsData ? (
              <EnumTooltipIcon values={enumsData.values}>
                <span
                  className={`
                      truncate font-mono text-muted-foreground underline
                      decoration-dotted
                    `}
                >
                  {column.typeLabel}
                </span>
              </EnumTooltipIcon>
            ) : (
              <span className="truncate font-mono text-muted-foreground">{column.typeLabel}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-stretch">
        {order !== null && (
          <span className="flex size-4 items-center justify-center text-primary">
            {order === 'ASC' ? (
              <RiArrowUpLine className="size-3 shrink-0" />
            ) : (
              <RiArrowDownLine className="size-3 shrink-0" />
            )}
          </span>
        )}
        {onResize && (
          // oxlint-disable-next-line jsx-a11y/click-events-have-key-events
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize column"
            tabIndex={0}
            className="
                group/resize flex cursor-col-resize items-stretch self-stretch
                p-1 select-none
              "
            // Drag-to-resize handle; interactions are pointer-driven by design
            onDoubleClick={removeSize}
            onMouseDown={e => {
              e.stopPropagation()
              handleResize(e)
            }}
            onClick={e => e.stopPropagation()}
          >
            <span
              className={cn(
                `
                  w-1 rounded-full bg-foreground/20 opacity-0
                  transition-opacity
                  group-hover/header-cell:opacity-100
                  group-hover/resize:bg-primary
                `,
                isResizing && `bg-primary! opacity-100!`,
              )}
            />
          </div>
        )}
      </div>
    </AppContextMenu>
  )
}

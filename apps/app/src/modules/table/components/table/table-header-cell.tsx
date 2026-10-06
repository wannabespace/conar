/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized flex grid cannot be built from table elements */
import {
  ArrowDown02Icon,
  ArrowLeftRightIcon,
  ArrowUp02Icon,
  Cancel01Icon,
  ChartHistogramIcon,
  Copy01Icon,
  LayoutThreeColumnIcon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
  Tag01Icon,
  TextIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { GridHeaderProps } from '@tamery/table'
import { ResizeHandle } from '@tamery/ui/components/custom/resize-handle'
import { copy } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { RefObject } from 'react'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { AppContextMenu, AppMenuButton } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'
import { resourceTableColumnsQueryOptions } from '~/core/queries/tables/columns'
import type { Column } from '~/core/table/cell/utils'
import { isTextType } from '~/core/table/cell/utils'

import { labelColumnOf } from '../../lib/labels'
import { columnLayout, columnsOrder, useTablePageStore } from '../../lib/store'
import { ColumnHeading } from './column-type'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const OFF = '__off__'

const ARIA_SORT = { ASC: 'ascending', DESC: 'descending' } as const
const CANNOT_SORT_TYPES = new Set(['json'])
const MIN_WIDTH = 100

interface ColumnActions {
  onRename?: () => void
  /** Stages one value in every selected row; absent when no row is selected or the column is read-only. */
  onSetSelected?: { count: number; set: () => void }
  onDistinctValues?: (anchor: Element) => void
}

const useColumnMenu = (
  column: Column,
  anchor: RefObject<HTMLDivElement | null>,
  { onRename, onSetSelected, onDistinctValues }: ColumnActions
) => {
  const store = useTablePageStore()
  const { hasCustomOrder, hasCustomSize, isPinned, order, storedLabel } =
    useSubscription(store, {
      selector: (state) => ({
        hasCustomOrder: state.columnOrder.length > 0,
        hasCustomSize: state.columnSizes[column.id] !== undefined,
        isPinned: state.pinnedColumns.includes(column.id),
        order: state.orderBy[column.id] ?? null,
        storedLabel: state.columnLabels[column.id],
      }),
    })
  const layout = columnLayout(store)
  const sorting = columnsOrder(store)
  const { connectionResource } = useRouteContext()
  const { data: referenced = [] } = useQuery({
    ...resourceTableColumnsQueryOptions({
      connectionResource,
      schema: column.foreign?.schema ?? '',
      table: column.foreign?.table ?? '',
    }),
    enabled: !!column.foreign,
  })
  const labelColumns = referenced
    .filter(
      (candidate) =>
        candidate.id !== column.foreign?.column && isTextType(candidate.type)
    )
    .map((candidate) => candidate.id)
  const label = labelColumnOf(
    storedLabel,
    referenced,
    column.foreign?.column ?? ''
  )
  const isSortable =
    !!column.typeLabel && !CANNOT_SORT_TYPES.has(column.typeLabel)

  const items = (): AppMenuNode[] => [
    ...(isSortable
      ? ([
          {
            checked: order === 'ASC' || undefined,
            icon: ArrowUp02Icon,
            label: 'Sort Ascending',
            onSelect: () =>
              order === 'ASC'
                ? sorting.removeOrder(column.id)
                : sorting.setOrder(column.id, 'ASC'),
          },
          {
            checked: order === 'DESC' || undefined,
            icon: ArrowDown02Icon,
            label: 'Sort Descending',
            onSelect: () =>
              order === 'DESC'
                ? sorting.removeOrder(column.id)
                : sorting.setOrder(column.id, 'DESC'),
          },
          ...(order
            ? [
                {
                  icon: Cancel01Icon,
                  label: 'Clear Sort',
                  onSelect: () => sorting.removeOrder(column.id),
                },
              ]
            : []),
          { type: 'separator' },
        ] satisfies AppMenuNode[])
      : []),
    ...(onSetSelected
      ? [
          {
            icon: TextIcon,
            label: `Set Value in ${onSetSelected.count} Selected Row${onSetSelected.count === 1 ? '' : 's'}…`,
            onSelect: onSetSelected.set,
          },
          { type: 'separator' } as const,
        ]
      : []),
    ...(onRename
      ? [{ icon: PencilEdit02Icon, label: 'Rename Column', onSelect: onRename }]
      : []),
    {
      icon: Copy01Icon,
      label: 'Copy Name',
      onSelect: () => copy(column.id, 'Column name copied'),
    },
    ...(onDistinctValues
      ? [
          {
            icon: ChartHistogramIcon,
            label: 'Distinct Values',
            onSelect: () => anchor.current && onDistinctValues(anchor.current),
          },
        ]
      : []),
    ...(column.foreign && labelColumns.length > 0
      ? [
          {
            icon: Tag01Icon,
            items: [
              {
                onValueChange: (next: string) =>
                  layout.setLabel(column.id, next === OFF ? '' : next),
                options: [
                  { label: 'Off', value: OFF },
                  ...labelColumns.map((id) => ({ label: id, value: id })),
                ],
                type: 'radio',
                value: label ?? OFF,
              } satisfies AppMenuNode,
            ],
            label: 'Show Labels',
            type: 'sub',
          } satisfies AppMenuNode,
        ]
      : []),
    { type: 'separator' },
    {
      icon: isPinned ? PinOffIcon : PinIcon,
      label: isPinned ? 'Unpin Column' : 'Pin Column',
      onSelect: () => layout.togglePin(column.id),
    },
    {
      icon: ViewOffSlashIcon,
      label: 'Hide Column',
      onSelect: () => layout.hide(column.id),
    },
    ...(hasCustomSize
      ? [
          {
            icon: ArrowLeftRightIcon,
            label: 'Reset Width',
            onSelect: () => layout.resetSize(column.id),
          },
        ]
      : []),
    ...(hasCustomOrder
      ? [
          {
            icon: LayoutThreeColumnIcon,
            label: 'Reset Column Order',
            onSelect: layout.resetOrder,
          },
        ]
      : []),
  ]

  return { items, layout, order }
}

const SortArrow = ({ order }: { order: 'ASC' | 'DESC' }) => (
  <HugeiconsIcon
    icon={order === 'ASC' ? ArrowUp02Icon : ArrowDown02Icon}
    strokeWidth={2}
    className="text-primary size-3 shrink-0"
  />
)

export const TableHeaderCell = ({
  column,
  header: { column: gridColumn, dragHandle, isDragging, setWidth, style },
  ...actions
}: ColumnActions & { column: Column; header: GridHeaderProps }) => {
  const ref = useRef<HTMLDivElement>(null)
  const width = useRef(0)
  const { items, layout, order } = useColumnMenu(column, ref, actions)

  return (
    <AppContextMenu
      items={items}
      contentProps={{ align: 'start', className: 'min-w-52', side: 'bottom' }}
      render={
        <div
          ref={ref}
          role="columnheader"
          aria-label={`${column.id} column`}
          aria-sort={order ? ARIA_SORT[order] : undefined}
          // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
          style={style}
          className={cn(
            'group/header relative flex items-center gap-1.5 py-1 pr-1.5 pl-2 outline-none select-none',
            gridColumn.pinned && 'bg-background z-10',
            isDragging && 'bg-background z-10 rounded-md shadow-md'
          )}
          {...dragHandle}
        />
      }
    >
      <div className="flex min-w-0 flex-1">
        <ColumnHeading column={column} />
      </div>
      {order && <SortArrow order={order} />}
      <AppMenuButton
        variant="muted"
        items={items}
        contentProps={{ align: 'end', className: 'min-w-52' }}
      />
      <ResizeHandle
        aria-label="Resize column"
        min={MIN_WIDTH}
        className="absolute inset-y-0 -right-1.5 z-10 flex w-3 justify-center"
        getValue={() => ref.current?.getBoundingClientRect().width ?? 0}
        onResize={(next) => {
          width.current = next
          setWidth(next)
        }}
        onResizingChange={(resizing) => {
          if (!resizing && width.current) {
            layout.resize(column.id, width.current)
          }
          width.current = 0
        }}
        onDoubleClick={() => layout.resetSize(column.id)}
      >
        <span className="bg-foreground/20 group-hover/resize-handle:bg-primary group-data-resizing/resize-handle:bg-primary w-0.5 opacity-0 transition-opacity group-hover/header:opacity-100 group-data-resizing/resize-handle:opacity-100" />
      </ResizeHandle>
    </AppContextMenu>
  )
}

export const TableFieldLabel = ({
  column,
  ...actions
}: ColumnActions & { column: Column }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { items, order } = useColumnMenu(column, ref, actions)

  return (
    <AppContextMenu
      items={items}
      contentProps={{ align: 'start', className: 'min-w-52', side: 'bottom' }}
      render={
        <div
          ref={ref}
          role="rowheader"
          aria-label={`${column.id} field`}
          aria-sort={order ? ARIA_SORT[order] : undefined}
          className="flex h-8 min-w-0 items-center gap-1.5 px-2 select-none"
        />
      }
    >
      <ColumnHeading column={column} />
      {order && <SortArrow order={order} />}
    </AppContextMenu>
  )
}

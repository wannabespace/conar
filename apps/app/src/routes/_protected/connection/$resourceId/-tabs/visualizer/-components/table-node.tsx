import {
  AppWindowIcon,
  Copy01Icon,
  Delete02Icon,
  EraserIcon,
  FlashIcon,
  Key01Icon,
  LayoutTable02Icon,
  LeftToRightListDashIcon,
  Link01Icon,
  LinkSquare02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
  SecurityCheckIcon,
  Undo02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { copy as copyToClipboard } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { AppContextMenu } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'

import type { DiagramActions, DiagramGates } from '../-lib/context'
import { relationTouches, tableMatches, useDiagram } from '../-lib/context'
import type { DiagramColumn, DiagramTable, TableKind } from '../-lib/schema'

export type TableNode = Node<{ table: DiagramTable }, 'table'>

export const handleId = (
  column: string,
  side: 'left' | 'right',
  kind: 'source' | 'target'
) => `${column}:${side}:${kind}`

export const parseHandleId = (id: string) => {
  const [column = '', , kind = 'source'] = id.split(':')
  return { column, kind }
}

const kindIcons: Record<TableKind, IconSvgElement> = {
  'materialized view': ViewIcon,
  table: LayoutTable02Icon,
  view: ViewIcon,
}

export const draftStateClass = {
  added: 'bg-success/8',
  changed: 'bg-primary/6 italic',
  dropped: 'bg-destructive/8 line-through opacity-60',
}

const Count = ({
  count,
  icon,
  label,
}: {
  count: number
  icon: IconSvgElement
  label: string
}) =>
  count > 0 && (
    <span
      title={`${count} ${label}`}
      className="text-2xs text-muted-foreground flex items-center gap-0.5 tabular-nums"
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3" />
      {count}
    </span>
  )

const handleClass =
  'border-popover bg-foreground/50! size-2! rounded-full border-2! opacity-0 transition-opacity group-hover/node:opacity-100 data-[linked=true]:opacity-100'

// Every handle subscribes to the flow store, so a card mounts only the
// handles an edge can end on: keys always (a drag may land on them), other
// columns' source handles only while the pointer is over the card.
const RowHandles = ({
  column,
  connectable,
  hovered,
  linked,
}: {
  column: DiagramColumn
  connectable: boolean
  hovered: boolean
  linked: boolean
}) => (
  <>
    {(column.primaryKey || column.unique) && (
      <>
        <Handle
          type="target"
          position={Position.Left}
          id={handleId(column.id, 'left', 'target')}
          isConnectable={connectable}
          data-linked={linked}
          className={cn(handleClass, '-left-1!')}
        />
        <Handle
          type="target"
          position={Position.Right}
          id={handleId(column.id, 'right', 'target')}
          isConnectable={connectable}
          data-linked={linked}
          className={cn(handleClass, '-right-1!')}
        />
      </>
    )}
    {connectable && (linked || hovered) && (
      <>
        <Handle
          type="source"
          position={Position.Right}
          id={handleId(column.id, 'right', 'source')}
          data-linked={linked}
          className={cn(handleClass, '-right-1!')}
        />
        <Handle
          type="source"
          position={Position.Left}
          id={handleId(column.id, 'left', 'source')}
          data-linked={linked}
          className={cn(handleClass, '-left-1!')}
        />
      </>
    )}
  </>
)

export const columnMenu = (
  table: DiagramTable,
  column: DiagramColumn,
  can: DiagramGates,
  actions: DiagramActions
): AppMenuNode[] => {
  const editable = table.kind === 'table' && column.state !== 'dropped'

  return [
    {
      icon: Copy01Icon,
      label: 'Copy Name',
      onSelect: () => copyToClipboard(column.name, 'Column name copied'),
    },
    { type: 'separator' },
    {
      disabled: !editable || (!can.renameColumns && column.state !== 'added'),
      icon: PencilEdit01Icon,
      label: 'Edit Column',
      onSelect: () => actions.editColumn(table, column),
    },
    {
      checked: column.nullable,
      disabled: !editable || column.primaryKey,
      icon: EraserIcon,
      label: column.nullable ? 'Require a Value' : 'Allow NULL',
      onSelect: () => actions.toggleNullable(table, column),
    },
    { type: 'separator' },
    column.state === 'dropped'
      ? {
          icon: Undo02Icon,
          label: 'Restore Column',
          onSelect: () => actions.dropColumn(table, column),
        }
      : {
          disabled: !editable,
          icon: Delete02Icon,
          label: 'Drop Column',
          onSelect: () => actions.dropColumn(table, column),
          variant: 'destructive',
        },
  ]
}

export const tableMenu = (
  table: DiagramTable,
  can: DiagramGates,
  actions: DiagramActions
): AppMenuNode[] => {
  const editable = table.kind === 'table'

  return [
    {
      icon: AppWindowIcon,
      label: 'Open in New Window',
      onSelect: () => actions.openTable(table, true),
    },
    { type: 'separator' },
    {
      icon: LinkSquare02Icon,
      label: 'Open Table',
      onSelect: () => actions.openTable(table),
    },
    {
      icon: Copy01Icon,
      label: 'Copy Name',
      onSelect: () => copyToClipboard(table.name, 'Table name copied'),
    },
    { type: 'separator' },
    {
      disabled: !editable || table.state === 'dropped',
      icon: PencilEdit01Icon,
      label: 'Rename Table',
      onSelect: () => actions.renameTable(table),
    },
    {
      disabled: !editable || table.state === 'dropped',
      icon: PlusSignIcon,
      label: 'Add Column',
      onSelect: () => actions.addColumn(table),
    },
    { type: 'separator' },
    ...(table.state === 'dropped'
      ? [
          {
            icon: Undo02Icon,
            label: 'Restore Table',
            onSelect: () => actions.restoreTable(table),
          } satisfies AppMenuNode,
        ]
      : [
          {
            disabled: !editable,
            icon: Delete02Icon,
            label: 'Drop Table',
            onSelect: () => actions.dropTable(table, false),
            variant: 'destructive',
          } satisfies AppMenuNode,
          ...(can.cascade && editable && table.state !== 'added'
            ? [
                {
                  icon: Delete02Icon,
                  label: 'Drop Table with Dependents',
                  onSelect: () => actions.dropTable(table, true),
                  variant: 'destructive',
                } satisfies AppMenuNode,
              ]
            : []),
        ]),
  ]
}

export const TableNodeView = ({ data, id, selected }: NodeProps<TableNode>) => {
  const { table } = data
  const { actions, can, diagram, search, view } = useDiagram()
  const [hovered, setHovered] = useState(false)
  const updateNodeInternals = useUpdateNodeInternals()
  // Handles mounted on hover are unknown to the flow until it re-measures.
  useEffect(() => {
    if (hovered) {
      updateNodeInternals(id)
    }
  }, [hovered, id, updateNodeInternals])
  const related = useSubscription(view, {
    selector: ({ hoveredRelationId, hoveredTableId }) =>
      diagram.relations.some(
        (relation) =>
          relationTouches(relation, table.id) &&
          (relation.id === hoveredRelationId ||
            (hoveredTableId !== null &&
              hoveredTableId !== table.id &&
              relationTouches(relation, hoveredTableId)))
      ),
  })
  const compact = useSubscription(view, { selector: (state) => state.compact })
  const linkedColumns = new Set(
    diagram.relations.flatMap((relation) => [
      relation.source.table === table.id ? relation.source.column : '',
      relation.target.table === table.id ? relation.target.column : '',
    ])
  )
  const connectable = can.foreignKeys && table.kind === 'table'
  const dimmed = !!search && !tableMatches(table, search)
  // One context menu per card: rows only record which column was hit.
  const menuColumn = useRef<DiagramColumn | null>(null)

  return (
    <AppContextMenu
      items={() =>
        menuColumn.current
          ? columnMenu(table, menuColumn.current, can, actions)
          : tableMenu(table, can, actions)
      }
      className="block"
    >
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        onMouseEnter={() => {
          setHovered(true)
          view.set((state) => ({ ...state, hoveredTableId: table.id }))
        }}
        onMouseLeave={() => {
          setHovered(false)
          view.set((state) => ({ ...state, hoveredTableId: null }))
        }}
        onContextMenuCapture={() => {
          menuColumn.current = null
        }}
        className={cn(
          'group/node bg-popover ring-foreground/4 relative w-64 rounded-xl text-xs shadow-md ring outline-2 outline-offset-2 outline-transparent transition-[box-shadow,opacity,outline-color] select-none',
          selected && 'outline-primary',
          related && 'outline-primary/40',
          dimmed && 'opacity-35',
          table.state === 'dropped' && 'opacity-60',
          table.state === 'added' && 'ring-success/40'
        )}
      >
        <header
          className={cn(
            'border-foreground/6 flex h-8 items-center gap-2 border-b px-3',
            table.state === 'changed' && 'italic',
            table.state === 'dropped' && 'line-through',
            compact && 'invisible'
          )}
        >
          <HugeiconsIcon
            icon={kindIcons[table.kind]}
            strokeWidth={2}
            className="text-muted-foreground size-4 shrink-0"
          />
          <span data-mask className="truncate text-sm font-medium">
            <HighlightText text={table.name} match={search} />
          </span>
          {table.kind !== 'table' && (
            <span className="text-2xs text-muted-foreground shrink-0 tracking-wider uppercase">
              {table.kind === 'view' ? 'view' : 'mat. view'}
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <Count
              count={table.counts.indexes}
              icon={LeftToRightListDashIcon}
              label="indexes"
            />
            <Count
              count={table.counts.triggers}
              icon={FlashIcon}
              label="triggers"
            />
            <Count
              count={table.counts.policies}
              icon={SecurityCheckIcon}
              label="policies"
            />
          </span>
        </header>
        <div className="py-1">
          {table.columns.map((column) => {
            const handles = (
              <RowHandles
                column={column}
                connectable={connectable}
                hovered={hovered}
                linked={linkedColumns.has(column.id)}
              />
            )

            if (compact) {
              return (
                <div key={column.id} className="relative h-7">
                  {handles}
                </div>
              )
            }

            return (
              // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
              <div
                key={column.id}
                onContextMenu={() => {
                  menuColumn.current = column
                }}
                className={cn(
                  'hover:bg-accent relative flex h-7 items-center gap-1.5 px-3 transition-colors',
                  column.state && draftStateClass[column.state]
                )}
              >
                {column.primaryKey && (
                  <HugeiconsIcon
                    icon={Key01Icon}
                    strokeWidth={2}
                    className="text-primary size-3 shrink-0"
                  />
                )}
                {!column.primaryKey && column.foreign && (
                  <HugeiconsIcon
                    icon={Link01Icon}
                    strokeWidth={2}
                    className="text-muted-foreground/70 size-3 shrink-0"
                  />
                )}
                <span data-mask className="truncate font-mono">
                  <HighlightText text={column.name} match={search} />
                </span>
                <span
                  data-mask
                  className="text-muted-foreground/70 ml-auto max-w-[45%] shrink-0 truncate font-mono"
                >
                  {column.type}
                  {column.nullable && '?'}
                </span>
                {handles}
              </div>
            )
          })}
          {table.columns.length === 0 && (
            <p className="text-muted-foreground flex h-7 items-center px-3">
              No columns yet
            </p>
          )}
        </div>
        {compact && (
          <div
            // Third bound keeps a long name inside the card: ~0.55em per glyph
            // over a 15rem inner width.
            style={{ '--label-length': table.name.length } as CSSProperties}
            className="pointer-events-none absolute inset-0 flex items-center justify-center px-2"
          >
            <span
              data-mask
              className="text-foreground max-w-full truncate text-[min(4rem,calc(0.875rem/var(--diagram-zoom)),calc(27rem/var(--label-length)))] leading-none font-medium"
            >
              {table.name}
            </span>
          </div>
        )}
      </div>
    </AppContextMenu>
  )
}

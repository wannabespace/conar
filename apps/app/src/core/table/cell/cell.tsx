/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized flex grid cannot be built from table elements */
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { cn } from '@tamery/ui/lib/utils'
import type { CSSProperties, ReactNode } from 'react'
import { useRef } from 'react'

import { createTransformer } from '~/core/transformers/create-transformer'
import type { ValueTransformer } from '~/core/transformers/value-transformer'

import { useCellCursor } from '../cursor-context'
import type { Draft } from '../session'
import { CellField } from './cell-editor'
import { Tag } from './cell-select'
import type { DataGridLayout } from './cursor'
import { isNested, JsonPeek, JsonTree } from './json-tree'
import type { Column } from './utils'
import { canWriteDefault, hasTabularFigures } from './utils'

const CURSOR_RING =
  'inset-ring-foreground/20 group-focus-within/grid:inset-ring-ring/50 inset-ring-3'

const CellValue = ({
  column,
  label,
  layout,
  size,
  transformer,
  value,
}: {
  column: Column
  label?: string
  layout: DataGridLayout
  size: number
  transformer: ValueTransformer
  value: unknown
}) => {
  if (value === undefined) {
    return <span className="italic">default</span>
  }
  if (value !== null && column.uiType === 'boolean') {
    return (
      <Checkbox
        aria-label={`Value of ${column.id}`}
        checked={transformer.fromConnection(value).toUI() === true}
        readOnly
        tabIndex={-1}
        className={cn(layout === 'documents' && 'my-0.5')}
      />
    )
  }
  if (value !== null && column.uiType === 'select') {
    return <Tag column={column} value={String(value)} />
  }
  const items: unknown =
    value !== null && column.uiType === 'list'
      ? transformer.fromConnection(value).toUI()
      : null
  if (Array.isArray(items) && items.length > 0) {
    return (
      <div
        className={cn(
          'flex min-w-0 flex-1 gap-1',
          layout === 'documents' ? 'flex-wrap py-0.5' : 'overflow-hidden'
        )}
      >
        {items.map((item, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- a list may repeat a value
          <Tag key={index} column={column} value={String(item)} />
        ))}
      </div>
    )
  }
  if (label !== undefined && value !== null) {
    return (
      <span data-mask className="flex min-w-0 flex-1 items-baseline gap-1.5">
        <span className="max-w-2/3 shrink-0 truncate">{label}</span>
        <span className="text-muted-foreground min-w-0 truncate tabular-nums">
          {transformer.toDisplay(value, size)}
        </span>
      </span>
    )
  }
  if (layout === 'documents' && isNested(value)) {
    return (
      <div className="min-w-0 flex-1 py-0.5">
        <JsonTree value={value} />
      </div>
    )
  }
  return (
    <span
      data-mask
      className={cn(
        layout === 'documents'
          ? 'my-0.5 line-clamp-4 min-w-0 flex-1 wrap-break-word whitespace-pre-wrap'
          : 'truncate',
        hasTabularFigures(column) && 'tabular-nums'
      )}
    >
      {transformer.toDisplay(value, size)}
    </span>
  )
}

const overlayClass = (
  state: ReturnType<typeof useCellCursor>['state'],
  draft: Pick<Draft, 'error' | 'isCommitting'> | undefined
) =>
  cn(
    'pointer-events-none absolute inset-0 -z-10',
    draft && 'bg-warning/15',
    draft?.error && 'bg-destructive/10 inset-ring-destructive/40 inset-ring',
    (state === 'cursor' || state === 'peek' || state === 'range-cursor') &&
      CURSOR_RING,
    (state === 'range' || state === 'range-cursor') && 'bg-primary/10'
  )

export const TableCell = ({
  children,
  column,
  connectionType,
  draft,
  flash,
  isDragging,
  label,
  pinned,
  rowIndex,
  size,
  style,
  value,
}: {
  children?: ReactNode
  column: Column
  connectionType: ConnectionType
  draft?: Pick<Draft, 'error' | 'isCommitting'>
  /** Set when a refetch changed the value; a new number replays the flash. */
  flash?: number
  isDragging: boolean
  /** A readable stand-in for the value, e.g. the referenced row's name; the value stays beside it. */
  label?: string
  pinned?: boolean
  rowIndex: number
  size: number
  style: CSSProperties
  value: unknown
}) => {
  const { cursor, layout, state, store } = useCellCursor({
    column: column.id,
    row: rowIndex,
  })
  const ref = useRef<HTMLDivElement>(null)
  const readOnly = !cursor.isEditable(column)
  const transformer = createTransformer(connectionType, column)

  return (
    <div
      ref={ref}
      role="gridcell"
      aria-selected={state !== null}
      data-cell
      data-cursor={state && state !== 'range' ? '' : undefined}
      data-column={column.id}
      data-row={rowIndex}
      title={draft?.error}
      // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
      style={style}
      className={cn(
        'group/cell relative isolate flex h-full scroll-mt-(--table-header-height) items-center gap-1 px-2 text-xs select-none',
        layout === 'documents' && 'min-w-0 py-1.5',
        (value === null || value === undefined || value === '') &&
          'text-muted-foreground/60',
        draft?.isCommitting && 'animate-pulse',
        pinned && 'bg-background row-hover:bg-accent z-10',
        isDragging && 'bg-background z-10'
      )}
    >
      {flash !== undefined && (
        <div
          key={flash}
          aria-hidden
          className="bg-primary/20 animate-out fade-out fill-mode-forwards pointer-events-none absolute inset-0 -z-10 duration-1500 ease-out"
        />
      )}
      {(state || draft) && (
        <div aria-hidden className={overlayClass(state, draft)} />
      )}
      <CellValue
        column={column}
        label={label}
        layout={layout}
        size={size}
        transformer={transformer}
        value={value}
      />
      {children}
      {state === 'peek' && isNested(value) && (
        <JsonPeek
          anchor={ref}
          column={column.id}
          onClose={() => store.set((current) => ({ ...current, peek: false }))}
          value={value}
        />
      )}
      {state === 'editing' && (
        <CellField
          anchor={ref}
          canDefault={canWriteDefault(connectionType, column)}
          column={column}
          connectionType={connectionType}
          cursor={cursor}
          readOnly={readOnly}
          store={store}
          transformer={transformer}
          value={value}
        />
      )}
    </div>
  )
}

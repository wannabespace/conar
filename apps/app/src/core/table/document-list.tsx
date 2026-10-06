/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized grid cannot be built from table elements */
import type { GridCellProps, GridRow, ScrollToCell } from '@tamery/table'
import { useEndReached } from '@tamery/table'
import { DEFAULT_ROW_HEIGHT } from '@tamery/table/constants'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import type { CSSProperties, ReactNode, Ref, RefObject } from 'react'
import { memo, useImperativeHandle } from 'react'

import { getDisplayValue } from '~/core/transformers/value-transformer'

import type { Column } from './cell/utils'

const OVERSCAN = 4
const END_REACHED_DOCUMENTS = 10
// Keep in step with DOCUMENT_ITEM_CLASS's `pt-5` plus DOCUMENT_HEADER_CLASS's `h-8`.
const DOCUMENT_CHROME = 52
const UNTRUNCATED = Number.MAX_SAFE_INTEGER
const NO_STYLE: CSSProperties = {}

export const DOCUMENT_ITEM_CLASS = 'pt-5 data-[index=0]:pt-0'
export const DOCUMENT_HEADER_CLASS =
  'text-muted-foreground flex h-8 min-w-0 items-center gap-1 px-4 text-2xs font-semibold tracking-wider whitespace-nowrap uppercase'
export const FIELD_ROW_CLASS = 'hover:bg-accent border-b px-2'

const identityColumns = (columns: Column[]) => {
  const keys = columns.filter((column) => column.primaryKey)
  if (keys.length > 0) {
    return keys
  }
  const unique = columns.find((column) => column.unique)?.unique
  return unique ? columns.filter((column) => column.unique === unique) : []
}

interface DocumentProps {
  columns: Column[]
  identity: Column[]
  index: number
  leading?: (props: GridCellProps) => ReactNode
  measureElement: (node: Element | null) => void
  renderCell: (props: GridCellProps) => ReactNode
  renderLabel: (column: Column) => ReactNode
  row: GridRow
}

const DocumentBase = ({
  columns,
  identity,
  index,
  leading,
  measureElement,
  renderCell,
  renderLabel,
  row,
}: DocumentProps) => {
  const label = identity
    .filter((column) => row[column.id] !== undefined)
    .map((column) => getDisplayValue(row[column.id], UNTRUNCATED))
    .join(' · ')
  return (
    <div
      ref={measureElement}
      data-index={index}
      role="row"
      className={`${DOCUMENT_ITEM_CLASS} grid grid-cols-[minmax(6rem,max-content)_minmax(0,1fr)]`}
    >
      {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- the row checkbox `leading` renders is the control */}
      <label
        className={`bg-background sticky top-0 z-40 col-span-2 tabular-nums ${DOCUMENT_HEADER_CLASS}`}
      >
        {leading && (
          <div className="-mx-1 flex shrink-0">
            {leading({
              column: { id: '', size: 0 },
              isDragging: false,
              row,
              rowIndex: index,
              style: NO_STYLE,
            })}
          </div>
        )}
        Row {index + 1}
        {label && (
          <span
            data-mask
            className="truncate font-normal tracking-normal normal-case"
          >
            · {label}
          </span>
        )}
      </label>
      {columns.map((column) => (
        <div
          key={column.id}
          className={`col-span-2 grid grid-cols-subgrid ${FIELD_ROW_CLASS}`}
        >
          {renderLabel(column)}
          {renderCell({
            column: { id: column.id, size: UNTRUNCATED },
            isDragging: false,
            row,
            rowIndex: index,
            style: NO_STYLE,
          })}
        </div>
      ))}
    </div>
  )
}

// Memoized so a range change renders only the documents it mounts, not every visible one.
const Document = memo(DocumentBase)

export const DocumentList = ({
  columns,
  footer,
  leading,
  onEndReached,
  renderBody,
  renderCell,
  renderLabel,
  rows,
  scrollRef,
  scrollToRef,
}: {
  columns: Column[]
  footer?: ReactNode
  leading?: (props: GridCellProps) => ReactNode
  onEndReached?: () => void
  renderBody: (body: ReactNode) => ReactNode
  renderCell: (props: GridCellProps) => ReactNode
  renderLabel: (column: Column) => ReactNode
  rows: GridRow[]
  scrollRef: RefObject<HTMLDivElement | null>
  scrollToRef?: Ref<ScrollToCell>
}) => {
  const { measureElement, scrollToIndex, totalSize, virtualItems } =
    useVirtualizer({
      count: rows.length,
      estimateSize: () => columns.length * DEFAULT_ROW_HEIGHT + DOCUMENT_CHROME,
      getScrollElement: () => scrollRef.current,
      overscan: OVERSCAN,
    })
  useImperativeHandle(scrollToRef, () => (row) => {
    scrollToIndex(row, { align: 'start' })
  })

  const identity = identityColumns(columns)

  useEndReached({
    count: rows.length,
    lastIndex: virtualItems.at(-1)?.index ?? 0,
    onEndReached,
    threshold: END_REACHED_DOCUMENTS,
  })

  return (
    <ScrollArea
      ref={scrollRef}
      role="grid"
      tabIndex={0}
      aria-rowcount={rows.length}
      className="group/grid table-scroller isolate size-full outline-none"
    >
      {renderBody(
        <div
          className="relative z-10 h-(--list-height) pt-(--list-top)"
          style={
            {
              '--list-height': `${totalSize}px`,
              '--list-top': `${virtualItems[0]?.start ?? 0}px`,
            } as CSSProperties
          }
        >
          {virtualItems.map((item) => {
            const row = rows[item.index]
            return (
              row && (
                <Document
                  key={item.key}
                  columns={columns}
                  identity={identity}
                  index={item.index}
                  leading={leading}
                  measureElement={measureElement}
                  renderCell={renderCell}
                  renderLabel={renderLabel}
                  row={row}
                />
              )
            )
          })}
        </div>
      )}
      {footer}
    </ScrollArea>
  )
}

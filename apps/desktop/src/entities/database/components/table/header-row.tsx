'use no memo'

import type { Header, HeaderGroup } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { flexRender } from '@tanstack/react-table'

function TableHeaderCell({
  virtualColumn,
  header,
}: {
  virtualColumn: VirtualItem
  header: Header<Record<string, unknown>, unknown>
}) {
  return (
    <div
      className="group/header absolute top-0 left-0 h-full"
      style={{
        transform: `translateX(${virtualColumn.start}px)`,
        width: `${header.getSize()}px`,
      }}
    >
      {flexRender(
        header.column.columnDef.header,
        header.getContext(),
      )}
    </div>
  )
}

function TableHeaderColumns({
  headerGroup,
  virtualColumns,
}: {
  headerGroup: HeaderGroup<Record<string, unknown>>
  virtualColumns: VirtualItem[]
}) {
  return virtualColumns.map((virtualColumn) => {
    const header = headerGroup.headers[virtualColumn.index]
    return (
      <TableHeaderCell
        key={header.id}
        virtualColumn={virtualColumn}
        header={header}
      />
    )
  })
}

export function TableHeaderRow({
  headerGroups,
  virtualColumns,
  rowWidth,
}: {
  headerGroups: HeaderGroup<Record<string, unknown>>[]
  virtualColumns: VirtualItem[]
  rowWidth: number
}) {
  return (
    <div className="sticky top-0 z-10 border-y bg-background">
      <div className="bg-muted/20">
        {headerGroups.map(headerGroup => (
          <div
            key={headerGroup.id}
            className="flex h-8 has-[[data-type]]:h-12 relative"
            style={{ width: `${rowWidth}px` }}
          >
            <TableHeaderColumns
              key={headerGroup.id}
              headerGroup={headerGroup}
              virtualColumns={virtualColumns}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

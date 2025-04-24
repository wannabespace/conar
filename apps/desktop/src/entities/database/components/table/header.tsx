import type { HeaderGroup, Header as HeaderType } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { flexRender } from '@tanstack/react-table'
import { memo } from 'react'
import { useVirtualColumnsContext } from '.'

const HeaderCell = memo(function HeaderCellMemo({
  virtualColumn,
  header,
}: {
  virtualColumn: VirtualItem
  header: HeaderType<Record<string, unknown>, unknown>
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
})

const HeaderColumns = memo(function HeaderColumnsMemo({ headerGroup }: { headerGroup: HeaderGroup<Record<string, unknown>> }) {
  const virtualColumns = useVirtualColumnsContext()

  return virtualColumns.map((virtualColumn) => {
    const header = headerGroup.headers[virtualColumn.index]
    return (
      <HeaderCell
        key={header.id}
        virtualColumn={virtualColumn}
        header={header}
      />
    )
  })
})

export const Header = memo(function HeaderMemo({
  headerGroups,
  rowWidth,
}: {
  headerGroups: HeaderGroup<Record<string, unknown>>[]
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
            <HeaderColumns
              key={headerGroup.id}
              headerGroup={headerGroup}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

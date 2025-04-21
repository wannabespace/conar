import type { HeaderGroup } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { flexRender } from '@tanstack/react-table'

export function TableHeader<T extends Record<string, unknown>>({ headerGroups, virtualColumns, rowWidth }: {
  headerGroups: HeaderGroup<T>[]
  virtualColumns: VirtualItem[]
  rowWidth: number
}) {
  'use no memo'
  return (
    <div className="sticky top-0 z-10 border-y bg-background">
      <div className="bg-muted/20">
        {headerGroups.map(headerGroup => (
          <div
            key={headerGroup.id}
            className="flex h-8 has-[[data-type]]:h-12 relative"
            style={{ width: `${rowWidth}px` }}
          >
            {virtualColumns.map((virtualColumn) => {
              const header = headerGroup.headers[virtualColumn.index]
              return (
                <div
                  key={header.id}
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
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

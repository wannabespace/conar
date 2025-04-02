import type { Header } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'

export function TableHead<T extends Record<string, unknown>>({ header }: { header: Header<T, unknown> }) {
  return (
    <div
      key={header.id}
      style={{ width: `${header.getSize()}px` }}
      className="shrink-0 text-xs p-2 group-first:pl-4 group-last:pr-4"
    >
      {header.isPlaceholder
        ? null
        : (
            <div
              className={header.column.getCanSort()
                ? 'cursor-pointer select-none'
                : ''}
              onClick={header.column.getToggleSortingHandler()}
            >
              {flexRender(
                header.column.columnDef.header,
                header.getContext(),
              )}
            </div>
          )}
    </div>
  )
}

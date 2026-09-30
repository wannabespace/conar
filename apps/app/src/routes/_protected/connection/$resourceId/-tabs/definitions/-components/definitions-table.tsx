import { pseudoRandom } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import { cn } from '@tamery/ui/lib/utils'
import type { CSSProperties, RefObject } from 'react'

import { AppContextMenu, AppMenuButton } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'

import type { CellContext, DefinitionsColumn } from '../-lib/columns'

export const cardClass =
  'bg-popover ring-foreground/4 rounded-xl shadow-xs ring'

const SKELETON_ROWS = 6
const SKELETON_MIN_WIDTH = 40
const SKELETON_WIDTH_RANGE = 45

const columnClass = ({ align }: Pick<DefinitionsColumn<unknown>, 'align'>) =>
  cn('truncate', align === 'end' && 'text-right')

const SkeletonRows = <T,>({ columns }: { columns: DefinitionsColumn<T>[] }) =>
  Array.from({ length: SKELETON_ROWS }, (_, row) => (
    <TableRow
      // oxlint-disable-next-line react/no-array-index-key
      key={`skeleton-${row}`}
      className="hover:bg-transparent"
    >
      {columns.map((column, index) => (
        <TableCell key={column.header} className={columnClass(column)}>
          <Skeleton
            className={cn(
              'h-3 w-(--bar-width) rounded-full',
              column.align === 'end' && 'ml-auto'
            )}
            style={
              {
                '--bar-width': `${SKELETON_MIN_WIDTH + pseudoRandom(row * columns.length + index) * SKELETON_WIDTH_RANGE}%`,
              } as CSSProperties
            }
          />
        </TableCell>
      ))}
      <TableCell />
    </TableRow>
  ))

export const DefinitionsTable = <T,>({
  columns,
  context,
  highlighted,
  keyOf,
  loading,
  menuOf,
  onOpen,
  rows,
  rowsRef,
}: {
  columns: DefinitionsColumn<T>[]
  context: CellContext
  highlighted: string | null
  keyOf: (item: T) => string
  loading: boolean
  menuOf: (item: T) => AppMenuNode[]
  onOpen: (item: T) => void
  rows: T[]
  rowsRef: RefObject<Map<string, HTMLTableRowElement>>
}) => (
  <div className={cn(cardClass, 'overflow-hidden')}>
    <Table className="min-w-xl table-fixed">
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.header}
              className={cn(column.width, columnClass(column))}
            >
              {column.header}
            </TableHead>
          ))}
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && <SkeletonRows columns={columns} />}
        {rows.map((item) => {
          const key = keyOf(item)

          return (
            <AppContextMenu
              key={key}
              items={() => menuOf(item)}
              render={
                // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                <TableRow
                  ref={(element) => {
                    if (element) {
                      rowsRef.current.set(key, element)
                    } else {
                      rowsRef.current.delete(key)
                    }
                  }}
                  data-highlighted={highlighted === key || undefined}
                  className="group/row data-highlighted:bg-foreground/7 transition-none"
                  onClick={() => onOpen(item)}
                />
              }
            >
              {columns.map((column) => (
                <TableCell key={column.header} className={columnClass(column)}>
                  {column.cell(item, context)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <AppMenuButton
                  items={() => menuOf(item)}
                  render={<Button variant="ghost-row" size="icon-xs" />}
                  className="-my-0.5"
                />
              </TableCell>
            </AppContextMenu>
          )
        })}
      </TableBody>
    </Table>
  </div>
)

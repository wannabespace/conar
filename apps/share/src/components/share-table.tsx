import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cardClass } from '@tamery/ui/components/card.utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import { cn } from '@tamery/ui/lib/utils'
import { Link } from '@tanstack/react-router'
import { type } from 'arktype'

export const shareSearch = type({
  'order?': '"asc" | "desc"',
  'page?': 'number.integer >= 1',
  'sort?': 'string',
})

type ShareSearch = typeof shareSearch.infer

const nextSort = (
  { order, sort }: ShareSearch,
  column: string
): ShareSearch => {
  if (sort !== column) {
    return { order: 'asc', sort: column }
  }
  return order === 'asc' ? { order: 'desc', sort: column } : {}
}

export const ShareTable = ({
  columns,
  rows,
  search,
}: {
  columns: string[]
  rows: (string | null)[][]
  search: ShareSearch
}) => (
  <div className={cn(cardClass, 'overflow-hidden')}>
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>
              <Link
                to="."
                search={nextSort(search, column)}
                className="text-foreground inline-flex items-center gap-1"
              >
                <span data-mask>{column}</span>
                {search.sort === column && (
                  <HugeiconsIcon
                    icon={
                      search.order === 'desc' ? ArrowDown01Icon : ArrowUp01Icon
                    }
                    strokeWidth={2}
                    className="text-muted-foreground size-3.5"
                  />
                )}
              </Link>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody data-mask>
        {rows.map((row, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- a page of rows has no key of its own; its position is its identity
          <TableRow key={index}>
            {row.map((value, column) => (
              <TableCell key={columns[column]} className="max-w-80 truncate">
                {value ?? <span className="text-muted-foreground">null</span>}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {rows.length === 0 && (
      <p className="text-muted-foreground p-6 text-center text-sm">
        No rows match.
      </p>
    )}
  </div>
)

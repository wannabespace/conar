import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { pseudoRandom } from '@tamery/shared/utils/helpers'
import { Button } from '@tamery/ui/components/button'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import type { ReactNode } from 'react'

import { PaneEmpty } from '~/components/pane-empty'

const SKELETON_ROWS = 6
const SKELETON_MIN_WIDTH = 40
const SKELETON_WIDTH_RANGE = 50

export const DefinitionsHeader = ({
  count,
  noun,
  title,
}: {
  count: number | undefined
  noun: string
  title: string
}) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="flex items-baseline gap-2 text-base font-semibold">
      {title}
      {count === undefined ? (
        <Skeleton className="h-3 w-5 self-center rounded-full" />
      ) : (
        <span className="text-muted-foreground text-sm font-normal tabular-nums">
          {count}
        </span>
      )}
    </h2>
    <Button variant="outline" disabled>
      <HugeiconsIcon
        icon={PlusSignIcon}
        strokeWidth={2}
        data-icon="inline-start"
      />
      Add {noun}
    </Button>
  </div>
)

export const DefinitionsToolbar = ({
  children,
  onSearchChange,
  placeholder,
  search,
}: {
  children: ReactNode
  onSearchChange: (value: string) => void
  placeholder: string
  search: string
}) => (
  <div className="flex items-center gap-2">
    <SearchInput
      className="flex-1"
      placeholder={placeholder}
      autoFocus
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onClear={() => onSearchChange('')}
    />
    {children}
  </div>
)

const SkeletonRows = ({ columns }: { columns: number }) =>
  Array.from({ length: SKELETON_ROWS }, (_, row) => (
    // oxlint-disable-next-line react/no-array-index-key
    <TableRow key={row} className="hover:bg-transparent">
      {Array.from({ length: columns }, (__, column) => (
        <TableCell
          // oxlint-disable-next-line react/no-array-index-key
          key={column}
          className="h-9"
        >
          <Skeleton
            className="h-3 rounded-full"
            style={{
              width: `${SKELETON_MIN_WIDTH + pseudoRandom(row * columns + column) * SKELETON_WIDTH_RANGE}%`,
            }}
          />
        </TableCell>
      ))}
    </TableRow>
  ))

export const DefinitionsList = ({
  children,
  columns,
  count,
  emptyDescription,
  emptyTitle,
  icon,
  loading,
}: {
  children: ReactNode
  columns: string[]
  count: number
  emptyDescription: string
  emptyTitle: string
  icon: IconSvgElement
  loading: boolean
}) => {
  if (!loading && count === 0) {
    return (
      <PaneEmpty
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="bg-card ring-foreground/4 overflow-hidden rounded-xl px-2 shadow-xs ring-[0.5px]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <SkeletonRows columns={columns.length} /> : children}
        </TableBody>
      </Table>
    </div>
  )
}

export const NameCell = ({
  children,
  icon,
}: {
  children: ReactNode
  icon: IconSvgElement
}) => (
  <TableCell
    data-mask
    className="font-medium wrap-break-word whitespace-normal"
  >
    <span className="flex items-center gap-2">
      <HugeiconsIcon
        icon={icon}
        strokeWidth={2}
        className="text-muted-foreground size-4 shrink-0"
      />
      {children}
    </span>
  </TableCell>
)

export const MutedCell = ({ children }: { children: ReactNode }) => (
  <TableCell className="text-muted-foreground">{children}</TableCell>
)

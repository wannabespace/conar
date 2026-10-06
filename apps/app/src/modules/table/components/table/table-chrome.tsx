import {
  MoreHorizontalIcon,
  PlusSignIcon,
  TableIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { GridRow } from '@tamery/table'
import {
  DEFAULT_COLUMN_WIDTH,
  LEADING_COLUMN_SIZE,
} from '@tamery/table/constants'
import { Button } from '@tamery/ui/components/button'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'

import { PaneEmpty } from '~/components/pane-empty'
import type { Column } from '~/core/table/cell/utils'
import { getColumnSize, INTERNAL_COLUMN_IDS } from '~/core/table/cell/utils'
import type { ExtraColumn } from '~/core/table/data-grid'
import type { GridBarItem } from '~/core/table/grid-bar'
import type { GridEntry } from '~/core/table/session'

import { ActionsDelete } from './actions-delete'
import { DraftsActions } from './drafts-actions'
import { LeadingCell, LeadingHeaderCell } from './table-selection'

const TRAILING_COLUMN_SIZE = 48
const REFERENCE_BUTTON_WIDTH = 24

export const defaultSize = (column: Column) =>
  (column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH) +
  (column.foreign ? REFERENCE_BUTTON_WIDTH : 0) +
  (column.references?.length ? REFERENCE_BUTTON_WIDTH : 0)

export const selectColumn = ({
  entryAt,
  keys,
  rows,
}: {
  entryAt: (rowIndex: number) => GridEntry
  keys: string[]
  rows: GridRow[]
}): ExtraColumn => ({
  id: INTERNAL_COLUMN_IDS.SELECT,
  renderCell: ({ rowIndex, style }) => (
    <LeadingCell
      entry={entryAt(rowIndex)}
      keys={keys}
      rows={rows}
      // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
      style={style}
    />
  ),
  renderHeader: ({ style }) => (
    <LeadingHeaderCell
      keys={keys}
      rows={rows}
      // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
      style={style}
    />
  ),
  size: LEADING_COLUMN_SIZE,
})

export const addColumnColumn = (onAddColumn?: () => void): ExtraColumn => ({
  id: INTERNAL_COLUMN_IDS.ACTIONS,
  // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
  renderCell: ({ style }) => <div aria-hidden style={style} />,
  renderHeader: ({ style }) => (
    // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
    <div className="flex items-center px-2" style={style}>
      {onAddColumn && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost-muted"
                size="icon-xs"
                aria-label="Add column"
                onClick={onAddColumn}
              />
            }
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent side="bottom">Add column</TooltipContent>
        </Tooltip>
      )}
    </div>
  ),
  size: TRAILING_COLUMN_SIZE,
})

export const tableBar = ({
  canDelete,
  hasChanges,
  schema,
  table,
}: {
  canDelete: boolean
  hasChanges: boolean
  schema: string
  table: string
}): GridBarItem[] => [
  ...(canDelete
    ? [
        {
          content: <ActionsDelete table={table} schema={schema} />,
          id: 'delete',
        },
      ]
    : []),
  ...(hasChanges
    ? [
        {
          content: <DraftsActions table={table} schema={schema} />,
          id: 'drafts',
        },
      ]
    : []),
]

export const EndOfRows = ({ hasNextPage }: { hasNextPage: boolean }) => (
  <div className="pointer-events-none sticky left-0 flex h-80 w-[100cqw] items-center justify-center">
    {hasNextPage ? (
      <Spinner />
    ) : (
      <PaneEmpty
        icon={MoreHorizontalIcon}
        title="No more rows"
        description="You've reached the end of this table."
      />
    )}
  </div>
)

export const NoRows = ({
  isDocuments,
  isFiltered,
}: {
  isDocuments: boolean
  isFiltered: boolean
}) => (
  <div
    className={cn(
      'pointer-events-none absolute inset-x-0 bottom-0 flex',
      isDocuments ? 'top-0' : 'top-8'
    )}
  >
    <PaneEmpty
      icon={TableIcon}
      title="No rows"
      description={
        isFiltered
          ? 'Nothing matches the current filters.'
          : 'This table is empty.'
      }
    />
  </div>
)

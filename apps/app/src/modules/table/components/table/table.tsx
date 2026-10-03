import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { enabledFilters } from '@tamery/shared/filters'
import type { ColumnRenderer, TableCellProps } from '@tamery/table'
import { Table, TableBody, TableProvider } from '@tamery/table'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'
import { useShiftSelectionKeyDown, useTableContext } from '@tamery/table/hooks'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ComponentRef } from 'react'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { TableCell } from '~/core/table/cell/cell'
import { INTERNAL_COLUMN_IDS, getColumnSize } from '~/core/table/cell/utils'
import type { Column, ColumnHandlers } from '~/core/table/cell/utils'
import {
  draftKey,
  draftsActions,
  getRowPrimaryKeysValues,
  useTableSessionStore,
} from '~/core/table/session'
import { TableError } from '~/core/table/table-error'
import { usePermissions } from '~/core/user/permissions'
import { NO_GUEST_FEATURES } from '~/store'

import { useTableColumnsContext } from '../../lib/columns'
import {
  useClearDraftsOnQueryChange,
  useSyncSelectionWithRows,
} from '../../lib/hooks'
import { columnsOrder, useTablePageStore } from '../../lib/store'
import { RenameColumnDialog } from './rename-column-dialog'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton, TableHeaderSkeleton } from './table-skeleton'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const EmptyCell = () => <div />

const BodyCellRenderer = ({
  canEdit,
  column,
  connectionType,
  primaryColumns,
  onAddFilter,
  onOrder,
  onRename,
  ...props
}: TableCellProps &
  ColumnHandlers & {
    canEdit: boolean
    column: Column
    connectionType: ConnectionType
    primaryColumns: string[]
  }) => {
  const sessionStore = useTableSessionStore()
  const row = useTableContext((ctx) => ctx.rows[props.rowIndex])
  const primaryKeys =
    row && primaryColumns.length > 0
      ? getRowPrimaryKeysValues(row, primaryColumns)
      : null
  const rowDraftKey = primaryKeys ? draftKey(primaryKeys, column.id) : null

  const queueValue = (_rowIndex: number, newValue: unknown) => {
    if (!primaryKeys) {
      throw new Error('Row not found. Please refresh the page.')
    }

    draftsActions(sessionStore).upsert({
      columnId: column.id,
      error: undefined,
      isCommitting: false,
      primaryKeys,
      value: newValue,
    })
  }

  const draft = useSubscription(sessionStore, {
    selector: (state) => (rowDraftKey ? state.drafts[rowDraftKey] : undefined),
  })
  const store = useTablePageStore()
  const order = useSubscription(store, {
    selector: (state) => state.orderBy[column.id] ?? null,
  })

  return (
    <TableCell
      column={column}
      onQueueValue={primaryKeys && canEdit ? queueValue : undefined}
      connectionType={connectionType}
      draft={draft}
      onAddFilter={onAddFilter}
      onOrder={onOrder}
      order={order}
      onRename={onRename}
      {...props}
    />
  )
}

const TableComponent = ({
  onAddColumn,
  table,
  schema,
}: {
  onAddColumn: () => void
  table: string
  schema: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const canEdit = usePermissions().check('database.edit')
  const { columns, isPending: isColumnsPending } = useTableColumnsContext()
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const hiddenColumns = useSubscription(store, {
    selector: (state) => state.hiddenColumns,
  })
  const columnSizes = useSubscription(store, {
    selector: (state) => state.columnSizes,
  })
  const activeFilters = useSubscription(store, {
    selector: (state) => state.filters,
  })
  const orderBy = useSubscription(store, {
    selector: (state) => state.orderBy,
  })
  const filters = enabledFilters(activeFilters)
  const {
    data: rows = [],
    error,
    isPending: isRowsPending,
  } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      connectionResource,
      query: { filters, orderBy },
      schema,
      table,
    })
  )
  const primaryColumns = columns.filter((c) => c.primaryKey).map((c) => c.id)
  const renameColumnRef = useRef<ComponentRef<typeof RenameColumnDialog>>(null)
  const { data: isBaseTable } = useQuery({
    ...resourceTablesAndSchemasQueryOptions({ connectionResource }),
    select: (data) =>
      data.schemas
        .find((entry) => entry.name === schema)
        ?.tables.find((entry) => entry.name === table)?.type === 'table',
  })

  useSyncSelectionWithRows(rows, primaryColumns)
  useClearDraftsOnQueryChange()

  const getHandlers = (column: Column): ColumnHandlers => ({
    onAddFilter: (filter) => {
      store.set(
        (state) =>
          ({
            ...state,
            filters: [...state.filters, filter],
          }) satisfies typeof state
      )
    },
    onOrder: (order) => {
      const actions = columnsOrder(store)
      if (order === undefined) {
        return actions.toggleOrder(column.id)
      }
      if (order) {
        return actions.setOrder(column.id, order)
      }
      return actions.removeOrder(column.id)
    },
    onRename:
      !column.primaryKey && capabilitiesOf(connection.type).renameColumns
        ? () => {
            renameColumnRef.current?.rename(schema, table, column.id)
          }
        : undefined,
    onResize: (newWidth) => {
      store.set(
        (state) =>
          ({
            ...state,
            columnSizes: {
              ...state.columnSizes,
              [column.id]: newWidth,
            },
          }) satisfies typeof state
      )
    },
  })

  const tableColumns: ColumnRenderer[] = columns
    .filter((c) => !hiddenColumns.includes(c.id))
    .map((column) => {
      const handlers = getHandlers(column)
      return {
        // oxlint-disable-next-line react/no-unstable-nested-components
        cell: (props) => (
          <BodyCellRenderer
            canEdit={canEdit}
            column={column}
            connectionType={connection.type}
            primaryColumns={primaryColumns}
            {...handlers}
            {...props}
          />
        ),
        // oxlint-disable-next-line react/no-unstable-nested-components
        header: (props) => (
          <TableHeaderCell column={column} {...handlers} {...props} />
        ),
        id: column.id,
        size:
          (column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH) +
          (column.references?.length ? 25 + 6 : 0) +
          (column.foreign ? 25 : 0),
      } satisfies ColumnRenderer
    })

  const selectionColumns: ColumnRenderer[] =
    primaryColumns.length > 0
      ? [
          {
            // oxlint-disable-next-line react/no-unstable-nested-components
            cell: (props) => <SelectionCell keys={primaryColumns} {...props} />,
            // oxlint-disable-next-line react/no-unstable-nested-components
            header: (props) => (
              <SelectionHeaderCell keys={primaryColumns} {...props} />
            ),
            id: INTERNAL_COLUMN_IDS.SELECT,
            size: 40,
          },
        ]
      : []

  const actionsColumn: ColumnRenderer = {
    cell: EmptyCell,
    // oxlint-disable-next-line react/no-unstable-nested-components
    header: ({ style }) => (
      <div className="flex shrink-0 items-center px-2" style={style}>
        {isBaseTable && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost-muted"
                  size="icon-xs"
                  aria-label="Add column"
                  disabled={!canEdit}
                  focusableWhenDisabled
                  data-guest-locked={
                    canEdit ? undefined : NO_GUEST_FEATURES.edit
                  }
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
    id: INTERNAL_COLUMN_IDS.ACTIONS,
    size: 200,
  }

  const providerColumns: ColumnRenderer[] = [
    ...selectionColumns,
    ...tableColumns,
    actionsColumn,
  ]

  const handleShiftSelectionKeyDown = useShiftSelectionKeyDown({
    getItemsInRange: (start, end) =>
      rows
        .slice(start, end + 1)
        .map((row) => getRowPrimaryKeysValues(row, primaryColumns)),
    getSelectionState: () => sessionStore.get().selectionState,
    onSelectionChange: (selected, selectionState) => {
      sessionStore.set(
        (state) =>
          ({ ...state, selected, selectionState }) satisfies typeof state
      )
    },
    rowCount: rows.length,
  })

  return (
    <TableProvider
      rows={rows}
      columns={providerColumns}
      customColumnSizes={columnSizes}
    >
      <div
        role="grid"
        className="relative size-full outline-none"
        tabIndex={0}
        onKeyDown={handleShiftSelectionKeyDown}
      >
        <Table>
          {tableColumns.length > 0 ? (
            <TableHeader />
          ) : (
            (isRowsPending || isColumnsPending) && (
              <TableHeaderSkeleton selectable={primaryColumns.length > 0} />
            )
          )}
          {(() => {
            if (isRowsPending || isColumnsPending) {
              return (
                <TableBodySkeleton selectable={primaryColumns.length > 0} />
              )
            }
            if (error) {
              return <TableError error={error} />
            }
            if (rows?.length === 0) {
              return (
                <TableEmpty
                  className="bottom-0 h-[calc(100%-5rem)]"
                  title="Table is empty"
                  description="There are no records to show"
                />
              )
            }
            if (tableColumns.length === 0) {
              return (
                <TableEmpty
                  className="h-[calc(100%-5rem)]"
                  title="No columns to show"
                  description="Please show at least one column"
                />
              )
            }
            return (
              <>
                <TableBody data-mask zebra className="bg-transparent" />
                <TableInfiniteLoader
                  table={table}
                  schema={schema}
                  filters={filters}
                  orderBy={orderBy}
                />
              </>
            )
          })()}
        </Table>
      </div>
      <RenameColumnDialog ref={renameColumnRef} />
    </TableProvider>
  )
}

export { TableComponent as Table }

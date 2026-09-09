import { CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME } from '@tamery/shared/connection-constants'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { enabledFilters } from '@tamery/shared/filters'
import type { ColumnRenderer, TableCellProps } from '@tamery/table'
import { Table, TableBody, TableProvider } from '@tamery/table'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'
import { useShiftSelectionKeyDown, useTableContext } from '@tamery/table/hooks'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ComponentRef } from 'react'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { TableCell } from '~/entities/connection/components/table/cell/cell'
import {
  INTERNAL_COLUMN_IDS,
  getColumnSize,
} from '~/entities/connection/components/table/cell/utils'
import type {
  Column,
  ColumnHandlers,
} from '~/entities/connection/components/table/cell/utils'
import { TableError } from '~/entities/connection/components/table/table-error'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries/rows'

import { useTableColumnsContext } from '../../-lib/columns'
import {
  useClearDraftsOnQueryChange,
  useSyncSelectionWithRows,
} from '../../-lib/hooks'
import {
  draftKey,
  draftsActions,
  getRowPrimaryKeysValues,
  useTableSessionStore,
} from '../../-lib/session-store'
import { columnsOrder, useTablePageStore } from '../../-lib/store'
import { RenameColumnDialog } from './rename-column-dialog'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton, TableHeaderSkeleton } from './table-skeleton'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const ACTIONS_COLUMN: ColumnRenderer = {
  id: INTERNAL_COLUMN_IDS.ACTIONS,
  size: 200,
  cell: () => <div />,
  header: () => <div />,
}

const BodyCellRenderer = ({
  column,
  connectionType,
  primaryColumns,
  onAddFilter,
  onOrder,
  onRename,
  ...props
}: TableCellProps &
  ColumnHandlers & {
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
      onQueueValue={primaryKeys ? queueValue : undefined}
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
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const { columns, isPending: isColumnsPending } = useTableColumnsContext()
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const hiddenColumns = useSubscription(store, {
    selector: (state) => state.hiddenColumns,
  })
  const columnSizes = useSubscription(store, {
    selector: (state) => state.columnSizes,
  })
  const filters = useSubscription(store, {
    selector: (state) => enabledFilters(state.filters),
    isEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  })
  const orderBy = useSubscription(store, {
    selector: (state) => state.orderBy,
  })
  const {
    data: rows = [],
    error,
    isPending: isRowsPending,
  } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      connectionResource,
      table,
      schema,
      query: { filters, orderBy },
    })
  )
  const primaryColumns = columns.filter((c) => c.primaryKey).map((c) => c.id)
  const renameColumnRef = useRef<ComponentRef<typeof RenameColumnDialog>>(null)

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
    onRename:
      !column.primaryKey &&
      !CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME.includes(connection.type)
        ? () => {
            renameColumnRef.current?.rename(schema, table, column.id)
          }
        : undefined,
  })

  const tableColumns: ColumnRenderer[] = columns
    .filter((c) => !hiddenColumns.includes(c.id))
    .map((column) => {
      const handlers = getHandlers(column)
      return {
        id: column.id,
        size:
          (column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH) +
          // 25 it's a ~size of the button, 6 it's a ~size of the number
          (column.references?.length ? 25 + 6 : 0) +
          (column.foreign ? 25 : 0),
        // oxlint-disable-next-line react/no-unstable-nested-components
        header: (props) => (
          <TableHeaderCell column={column} {...handlers} {...props} />
        ),
        // oxlint-disable-next-line react/no-unstable-nested-components
        cell: (props) => (
          <BodyCellRenderer
            column={column}
            connectionType={connection.type}
            primaryColumns={primaryColumns}
            {...handlers}
            {...props}
          />
        ),
      } satisfies ColumnRenderer
    })

  const selectionColumns: ColumnRenderer[] =
    primaryColumns.length > 0
      ? [
          {
            id: INTERNAL_COLUMN_IDS.SELECT,
            // oxlint-disable-next-line react/no-unstable-nested-components
            cell: (props) => <SelectionCell keys={primaryColumns} {...props} />,
            // oxlint-disable-next-line react/no-unstable-nested-components
            header: (props) => (
              <SelectionHeaderCell keys={primaryColumns} {...props} />
            ),
            size: 40,
          },
        ]
      : []

  const providerColumns: ColumnRenderer[] = [
    ...selectionColumns,
    ...tableColumns,
    ACTIONS_COLUMN,
  ]

  const handleShiftSelectionKeyDown = useShiftSelectionKeyDown({
    rowCount: rows.length,
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
            <TableHeader className="bg-background rounded-none inset-shadow-[0_-1px_0_0_var(--color-border)] inset-ring-0" />
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

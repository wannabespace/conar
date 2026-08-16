import { RiAlertLine } from '@remixicon/react'
import { CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME } from '@tamery/shared/constants'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { enabledFilters } from '@tamery/shared/filters'
import type { ColumnRenderer, TableCellProps } from '@tamery/table'
import { Table, TableBody, TableProvider } from '@tamery/table'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'
import { useShiftSelectionKeyDown, useTableContext } from '@tamery/table/hooks'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { ComponentRef } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import {
  TableCell,
  getColumnSize,
  INTERNAL_COLUMN_IDS,
} from '~/entities/connection/components/table/cell'
import type {
  Column,
  ColumnHandlers,
} from '~/entities/connection/components/table/cell'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'

import { useTableColumnsContext } from '../../-lib/columns'
import {
  useClearDraftsOnQueryChange,
  useSyncSelectionWithRows,
} from '../../-lib/hooks'
import {
  columnsOrder,
  draftKey,
  draftsActions,
  getRowPrimaryKeysValues,
  useTablePageStore,
} from '../../-lib/store'
import { RenameColumnDialog } from './rename-column-dialog'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton, TableHeaderSkeleton } from './table-skeleton'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const errorCauseText = (cause: unknown) => {
  if (cause === null || cause === undefined) {
    return null
  }

  if (cause instanceof Error) {
    return cause.message
  }

  if (typeof cause === 'object') {
    try {
      return JSON.stringify(cause, null, 2)
    } catch {
      return String(cause)
    }
  }

  return String(cause)
}

export const TableError = ({ error }: { error: Error }) => {
  const [showDetails, setShowDetails] = useState(false)

  const [summary] = error.message.split('\n')
  const rawCause = errorCauseText(error.cause)
  const cause =
    rawCause && !(error.message && rawCause.includes(error.message))
      ? rawCause
      : null
  const details = [error.message, cause].filter(Boolean).join('\n\n')
  const hasDetails = details !== summary

  return (
    <div className="pointer-events-none sticky left-0 flex h-full items-center justify-center overflow-hidden p-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="pointer-events-auto relative flex w-full max-w-lg flex-col items-center"
      >
        <div className="border-destructive/10 bg-destructive/10 mb-5 flex size-14 items-center justify-center rounded-2xl border">
          <RiAlertLine className="text-destructive size-7" />
        </div>

        <h2 className="text-base font-semibold tracking-tight">Query failed</h2>
        <p className="text-muted-foreground mt-1.5 text-center text-sm">
          Check your filters and try again.
        </p>

        <p
          data-mask
          className="text-2xs text-muted-foreground/70 mt-4 max-w-md text-center font-mono leading-relaxed"
        >
          {summary}
        </p>

        {hasDetails && (
          <button
            type="button"
            className="text-muted-foreground/70 hover:text-foreground focus-visible:text-foreground mt-5 cursor-default rounded-md px-1.5 py-0.5 text-xs outline-none"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        )}

        {hasDetails && (
          <motion.div
            initial={false}
            animate={{ gridTemplateRows: showDetails ? '1fr' : '0fr' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="grid w-full"
          >
            <div className="min-h-0 overflow-hidden">
              <ScrollArea
                data-mask
                className="text-2xs text-muted-foreground/80 mt-4 max-h-56 border-t pt-4 text-left font-mono leading-relaxed whitespace-pre-wrap"
              >
                {details}
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

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
  onQueueValue,
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
  const store = useTablePageStore()
  const row = useTableContext((ctx) => ctx.rows[props.rowIndex])
  const rowDraftKey =
    row && primaryColumns.length > 0
      ? draftKey(getRowPrimaryKeysValues(row, primaryColumns), column.id)
      : null

  const draft = useSubscription(store, {
    selector: (state) =>
      rowDraftKey
        ? state.drafts.find(
            (d) => draftKey(d.primaryKeys, d.columnId) === rowDraftKey
          )
        : undefined,
  })
  const order = useSubscription(store, {
    selector: (state) => state.orderBy[column.id] ?? null,
  })

  return (
    <TableCell
      column={column}
      onQueueValue={primaryColumns.length > 0 ? onQueueValue : undefined}
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
  const primaryColumns = useMemo(
    () => columns.filter((c) => c.primaryKey).map((c) => c.id),
    [columns]
  )
  const renameColumnRef = useRef<ComponentRef<typeof RenameColumnDialog>>(null)

  useSyncSelectionWithRows(rows, primaryColumns)
  useClearDraftsOnQueryChange()

  const getHandlers = useCallback(
    (column: Column): ColumnHandlers => ({
      onQueueValue: (rowIndex, newValue) => {
        if (primaryColumns.length === 0) {
          throw new Error(
            'No primary keys found. Please use SQL Runner to update this row.'
          )
        }

        const row = rows[rowIndex]
        if (!row) {
          throw new Error('Row not found. Please refresh the page.')
        }

        draftsActions(store).upsert({
          primaryKeys: getRowPrimaryKeysValues(row, primaryColumns),
          columnId: column.id,
          value: newValue,
          error: undefined,
          isCommitting: false,
        })
      },
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
    }),
    [store, rows, primaryColumns, schema, table, connection.type]
  )

  const tableColumns = useMemo<ColumnRenderer[]>(
    () =>
      columns
        .filter((c) => !hiddenColumns.includes(c.id))
        .map((column) => {
          const handlers = getHandlers(column)
          return {
            id: column.id,
            size:
              (column.type
                ? getColumnSize(column.type)
                : DEFAULT_COLUMN_WIDTH) +
              // 25 it's a ~size of the button, 6 it's a ~size of the number
              (column.references?.length ? 25 + 6 : 0) +
              (column.foreign ? 25 : 0),
            // Column renderers are invoked as components by @tamery/table
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
        }),
    [columns, hiddenColumns, connection.type, primaryColumns, getHandlers]
  )

  const providerColumns = useMemo<ColumnRenderer[]>(() => {
    const result: ColumnRenderer[] = []
    if (primaryColumns.length > 0) {
      result.push({
        id: INTERNAL_COLUMN_IDS.SELECT,
        // oxlint-disable-next-line react/no-unstable-nested-components
        cell: (props) => <SelectionCell keys={primaryColumns} {...props} />,
        // oxlint-disable-next-line react/no-unstable-nested-components
        header: (props) => (
          <SelectionHeaderCell keys={primaryColumns} {...props} />
        ),
        size: 40,
      })
    }
    result.push(...tableColumns, ACTIONS_COLUMN)
    return result
  }, [primaryColumns, tableColumns])

  const handleShiftSelectionKeyDown = useShiftSelectionKeyDown({
    rowCount: rows.length,
    getItemsInRange: (start, end) =>
      rows
        .slice(start, end + 1)
        .map((row) => getRowPrimaryKeysValues(row, primaryColumns)),
    getSelectionState: () => store.get().selectionState,
    onSelectionChange: (selected, selectionState) => {
      store.set(
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

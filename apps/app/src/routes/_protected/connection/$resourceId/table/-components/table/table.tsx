import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ColumnRenderer, TableCellProps } from '@conar/table'
import type { ComponentRef } from 'react'
import type { Column, ColumnHandlers } from '~/entities/connection/components/table/cell'
import { CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME } from '@conar/shared/constants'
import { Table, TableBody, TableProvider } from '@conar/table'
import { DEFAULT_COLUMN_WIDTH } from '@conar/table/constants'
import { useShiftSelectionKeyDown, useTableContext } from '@conar/table/hooks'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useRef } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { TableCell } from '~/entities/connection/components'
import { getColumnSize, INTERNAL_COLUMN_IDS } from '~/entities/connection/components/table/cell'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { Route } from '../..'
import { useTableColumns } from '../../-columns'
import { useClearDraftsOnQueryChange, useSyncSelectionWithRows } from '../../-hooks'
import { columnsOrder, draftKey, draftsActions, getRowPrimaryKeysValues, isNewRow, NEW_ROW_KEY, useTablePageStore } from '../../-store'
import { DraftsToolbar } from './drafts-toolbar'
import { RenameColumnDialog } from './rename-column-dialog'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton } from './table-skeleton'

export function TableError({ error }: { error: Error }) {
  return (
    <div className={`
      pointer-events-none sticky left-0 flex h-full items-center justify-center
      pb-10
    `}
    >
      <div className={`
        flex max-w-md flex-col items-center rounded-lg border bg-card p-4
      `}
      >
        <div className="mb-1 text-destructive">
          Error occurred
        </div>
        <p className="text-center font-mono text-sm text-muted-foreground">
          {error.message}
        </p>
      </div>
    </div>
  )
}

const ACTIONS_COLUMN: ColumnRenderer = {
  id: INTERNAL_COLUMN_IDS.ACTIONS,
  size: 200,
  cell: () => <div />,
  header: () => <div />,
}

const AUTO_TIMESTAMP_NAME_REGEX = /^(?:created_at|updated_at|inserted_at|modified_at)$/i

function buildDuplicateValues(row: Record<string, unknown>, columns: Column[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const column of columns) {
    const hasDefault = column.defaultValue != null
    if (column.isIdentity || (hasDefault && (column.primaryKey || AUTO_TIMESTAMP_NAME_REGEX.test(column.id))))
      continue
    const isUuidPk = column.primaryKey && column.type?.toLowerCase().includes('uuid')
    values[column.id] = isUuidPk ? v7() : row[column.id]
  }
  return values
}

function getRowPrimaryKeys(row: Record<string, unknown>, primaryColumns: string[]) {
  if (isNewRow(row))
    return { [NEW_ROW_KEY]: row[NEW_ROW_KEY] }
  return primaryColumns.length > 0 ? getRowPrimaryKeysValues(row, primaryColumns) : null
}

function BodyCellRenderer({
  column,
  connectionType,
  primaryColumns,
  onQueueValue,
  onAddFilter,
  onOrder,
  onRename,
  onDuplicateRow,
  ...props
}: TableCellProps & ColumnHandlers & {
  column: Column
  connectionType: ConnectionType
  primaryColumns: string[]
}) {
  const store = useTablePageStore()
  const row = useTableContext(ctx => ctx.rows[props.rowIndex])
  const primaryKeys = row ? getRowPrimaryKeys(row, primaryColumns) : null
  const rowDraftKey = primaryKeys ? draftKey(primaryKeys, column.id) : null

  const draft = useSubscription(store, {
    selector: state => rowDraftKey
      ? state.drafts.find(d => draftKey(d.primaryKeys, d.columnId) === rowDraftKey)
      : undefined,
  })
  const order = useSubscription(store, { selector: state => state.orderBy[column.id] ?? null })

  return (
    <TableCell
      column={column}
      onQueueValue={primaryKeys ? onQueueValue : undefined}
      connectionType={connectionType}
      draft={draft}
      onAddFilter={onAddFilter}
      onOrder={onOrder}
      order={order}
      onRename={onRename}
      onDuplicateRow={onDuplicateRow}
      {...props}
    />
  )
}

function TableComponent({ table, schema }: { table: string, schema: string }) {
  const { connection, connectionResource } = Route.useRouteContext()
  const columns = useTableColumns()
  const store = useTablePageStore()
  const hiddenColumns = useSubscription(store, { selector: state => state.hiddenColumns })
  const columnSizes = useSubscription(store, { selector: state => state.columnSizes })
  const filters = useSubscription(store, { selector: state => state.filters })
  const orderBy = useSubscription(store, { selector: state => state.orderBy })
  const drafts = useSubscription(store, { selector: state => state.drafts })
  const { data: rows = [], error, isPending: isRowsPending } = useInfiniteQuery(resourceRowsQueryInfiniteOptions({ connectionResource, table, schema, query: { filters, orderBy } }))
  const primaryColumns = useMemo(() => columns.filter(c => c.primaryKey).map(c => c.id), [columns])
  const renameColumnRef = useRef<ComponentRef<typeof RenameColumnDialog>>(null)

  const newRows = useMemo(() => {
    const groups = new Map<string, Record<string, unknown>>()
    for (const draft of drafts) {
      if (!isNewRow(draft.primaryKeys))
        continue
      const id = draft.primaryKeys[NEW_ROW_KEY] as string
      const row = groups.get(id) ?? { [NEW_ROW_KEY]: id }
      row[draft.columnId] = draft.value
      groups.set(id, row)
    }
    return Array.from(groups.values())
  }, [drafts])

  const allRows = useMemo(() => [...newRows, ...rows], [newRows, rows])

  useSyncSelectionWithRows(rows, primaryColumns)
  useClearDraftsOnQueryChange()

  const getHandlers = useCallback((column: Column): ColumnHandlers => ({
    onQueueValue: async (rowIndex, newValue) => {
      const row = allRows[rowIndex]
      if (!row)
        throw new Error('Row not found. Please refresh the page.')

      const primaryKeys = getRowPrimaryKeys(row, primaryColumns)
      if (!primaryKeys)
        throw new Error('No primary keys found. Please use SQL Runner to update this row.')

      draftsActions(store).upsert({
        primaryKeys,
        columnId: column.id,
        value: newValue,
        error: undefined,
        isCommitting: false,
      })
    },
    onAddFilter: (filter) => {
      store.set(state => ({
        ...state,
        filters: [...state.filters, filter],
      } satisfies typeof state))
    },
    onOrder: (order) => {
      const actions = columnsOrder(store)
      if (order === undefined)
        return actions.toggleOrder(column.id)
      if (order)
        return actions.setOrder(column.id, order)
      return actions.removeOrder(column.id)
    },
    onResize: (newWidth) => {
      store.set(state => ({
        ...state,
        columnSizes: {
          ...state.columnSizes,
          [column.id]: newWidth,
        },
      } satisfies typeof state))
    },
    onRename: !column.primaryKey && !CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME.includes(connection.type)
      ? () => {
          renameColumnRef.current?.rename(schema, table, column.id)
        }
      : undefined,
    onDuplicateRow: (rowIndex) => {
      const row = allRows[rowIndex]
      if (!row)
        return
      const values = buildDuplicateValues(row, columns)
      if (Object.keys(values).length === 0) {
        toast.warning('Nothing to duplicate', {
          description: 'All columns are auto-generated (identity, default-PK, or default timestamp).',
        })
        return
      }
      draftsActions(store).addNewRow(values)
    },
  }), [store, allRows, primaryColumns, columns, schema, table, connection.type])

  const tableColumns = useMemo<ColumnRenderer[]>(() => {
    return columns
      .filter(c => !hiddenColumns.includes(c.id))
      .map((column) => {
        const handlers = getHandlers(column)
        return {
          id: column.id,
          size: (column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH)
            // 25 it's a ~size of the button, 6 it's a ~size of the number
            + (column.references?.length ? 25 + 6 : 0)
            + (column.foreign ? 25 : 0),
          header: props => (
            <TableHeaderCell
              column={column}
              {...handlers}
              {...props}
            />
          ),
          cell: props => (
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
  }, [columns, hiddenColumns, connection.type, primaryColumns, getHandlers])

  const providerColumns = useMemo<ColumnRenderer[]>(() => {
    const result: ColumnRenderer[] = []
    if (primaryColumns.length > 0) {
      result.push({
        id: INTERNAL_COLUMN_IDS.SELECT,
        cell: props => <SelectionCell keys={primaryColumns} {...props} />,
        header: props => <SelectionHeaderCell keys={primaryColumns} {...props} />,
        size: 40,
      })
    }
    result.push(...tableColumns)
    result.push(ACTIONS_COLUMN)
    return result
  }, [primaryColumns, tableColumns])

  const handleShiftSelectionKeyDown = useShiftSelectionKeyDown({
    rowCount: allRows.length,
    getItemsInRange: (start, end) => allRows
      .slice(start, end + 1)
      .filter(row => !isNewRow(row))
      .map(row => getRowPrimaryKeysValues(row, primaryColumns)),
    getSelectionState: () => store.get().selectionState,
    onSelectionChange: (selected, selectionState) => {
      store.set(state => ({ ...state, selected, selectionState } satisfies typeof state))
    },
  })

  return (
    <TableProvider
      rows={allRows}
      columns={providerColumns}
      customColumnSizes={columnSizes}
    >
      <div
        role="grid"
        className="relative size-full bg-background outline-none"
        tabIndex={0}
        onKeyDown={handleShiftSelectionKeyDown}
      >
        <Table>
          {tableColumns.length > 0 && <TableHeader />}
          {isRowsPending
            ? <TableBodySkeleton selectable={primaryColumns.length > 0} />
            : error
              ? <TableError error={error} />
              : allRows.length === 0
                ? <TableEmpty className="bottom-0 h-[calc(100%-5rem)]" title="Table is empty" description="There are no records to show" />
                : tableColumns.length === 0
                  ? <TableEmpty className="h-[calc(100%-5rem)]" title="No columns to show" description="Please show at least one column" />
                  : (
                      <>
                        <TableBody data-mask className="bg-background" />
                        <TableInfiniteLoader
                          table={table}
                          schema={schema}
                          filters={filters}
                          orderBy={orderBy}
                        />
                      </>
                    )}
        </Table>
        <DraftsToolbar
          table={table}
          schema={schema}
        />
      </div>
      <RenameColumnDialog ref={renameColumnRef} />
    </TableProvider>
  )
}

export {
  TableComponent as Table,
}

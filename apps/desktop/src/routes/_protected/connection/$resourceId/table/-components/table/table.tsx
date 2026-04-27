import type { ColumnRenderer } from '@conar/table'
import type { ComponentRef } from 'react'
import { CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME } from '@conar/shared/constants'
import { Table, TableBody, TableProvider } from '@conar/table'
import { DEFAULT_COLUMN_WIDTH } from '@conar/table/constants'
import { useShiftSelectionKeyDown } from '@conar/table/hooks'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'
import { TableCell } from '~/entities/connection/components'
import { getColumnSize, INTERNAL_COLUMN_IDS } from '~/entities/connection/components/table/cell'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { Route } from '../..'
import { useTableColumns } from '../../-columns'
import { useClearDraftsOnQueryChange, useSyncSelectionWithRows } from '../../-hooks'
import { columnsOrder, draftKey, draftsActions, getRowPrimaryKeysValues, useTablePageStore } from '../../-store'
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

function TableComponent({ table, schema }: { table: string, schema: string }) {
  const { connection, connectionResource } = Route.useRouteContext()
  const columns = useTableColumns()
  const store = useTablePageStore()
  const hiddenColumns = useSubscription(store, { selector: state => state.hiddenColumns })
  const columnSizes = useSubscription(store, { selector: state => state.columnSizes })
  const filters = useSubscription(store, { selector: state => state.filters })
  const orderBy = useSubscription(store, { selector: state => state.orderBy })
  const draftsMap = useSubscription(store, {
    selector: state => new Map(state.drafts.map(d => [draftKey(d.primaryKeys, d.columnId), d])),
  })
  const { toggleOrder, setOrder, removeOrder } = columnsOrder(store)
  const { upsert: upsertDraft } = draftsActions(store)
  const { data: rows = [], error, isPending: isRowsPending } = useInfiniteQuery(resourceRowsQueryInfiniteOptions({ connectionResource, table, schema, query: { filters, orderBy } }))
  const primaryColumns = columns.filter(c => c.primaryKey).map(c => c.id)
  const renameColumnRef = useRef<ComponentRef<typeof RenameColumnDialog>>(null)

  useSyncSelectionWithRows(rows, primaryColumns)
  useClearDraftsOnQueryChange()

  const queueValue = async (rowIndex: number, columnId: string, newValue: unknown) => {
    if (primaryColumns.length === 0)
      throw new Error('No primary keys found. Please use SQL Runner to update this row.')

    const row = rows[rowIndex]
    if (!row)
      throw new Error('Row not found. Please refresh the page.')

    upsertDraft({
      primaryKeys: getRowPrimaryKeysValues(row, primaryColumns),
      columnId,
      value: newValue,
      error: undefined,
      isCommitting: false,
    })
  }

  const tableColumns: ColumnRenderer[] = columns
    .filter(c => !hiddenColumns.includes(c.id))
    .map(column => ({
      id: column.id,
      size: (column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH)
        // 25 it's a ~size of the button, 6 it's a ~size of the number
        + (column.references?.length ? 25 + 6 : 0)
        + (column.foreign ? 25 : 0),
      header: props => (
        <TableHeaderCell
          column={column}
          onSort={() => toggleOrder(column.id)}
          onRename={!column.primaryKey && !CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME.includes(connection.type)
            ? () => renameColumnRef.current?.rename(schema, table, column.id)
            : undefined}
          onResize={(newWidth) => {
            store.set(state => ({
              ...state,
              columnSizes: {
                ...state.columnSizes,
                [column.id]: newWidth,
              },
            } satisfies typeof state))
          }}
          {...props}
        />
      ),
      cell: (props) => {
        const row = rows[props.rowIndex]

        return (
          <TableCell
            column={column}
            onQueueValue={primaryColumns.length > 0 ? queueValue : undefined}
            connectionType={connection.type}
            draft={row && primaryColumns.length > 0
              ? draftsMap.get(draftKey(getRowPrimaryKeysValues(row, primaryColumns), column.id))
              : undefined}
            onAddFilter={filter => store.set(state => ({
              ...state,
              filters: [...state.filters, filter],
            } satisfies typeof state))}
            onSort={(columnId, order) => order ? setOrder(columnId, order) : removeOrder(columnId)}
            sortOrder={orderBy[column.id] ?? null}
            onRenameColumn={!column.primaryKey && !CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME.includes(connection.type)
              ? () => renameColumnRef.current?.rename(schema, table, column.id)
              : undefined}
            {...props}
          />
        )
      },
    }) satisfies ColumnRenderer)

  const handleShiftSelectionKeyDown = useShiftSelectionKeyDown({
    rowCount: rows.length,
    getItemsInRange: (start, end) => rows
      .slice(start, end + 1)
      .map(row => getRowPrimaryKeysValues(row, primaryColumns)),
    getSelectionState: () => store.get().selectionState,
    onSelectionChange: (selected, selectionState) => {
      store.set(state => ({ ...state, selected, selectionState } satisfies typeof state))
    },
  })

  return (
    <TableProvider
      rows={rows}
      columns={[
        ...(primaryColumns.length > 0
          ? [{
            id: INTERNAL_COLUMN_IDS.SELECT,
            cell: props => <SelectionCell keys={primaryColumns} {...props} />,
            header: props => <SelectionHeaderCell keys={primaryColumns} {...props} />,
            size: 40,
          } satisfies ColumnRenderer]
          : []),
        ...tableColumns,
        {
          id: INTERNAL_COLUMN_IDS.ACTIONS,
          size: 100,
          cell: () => <div />,
          header: () => <div />,
        },
      ]}
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
              : rows?.length === 0
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

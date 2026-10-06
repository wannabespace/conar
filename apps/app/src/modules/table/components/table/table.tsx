import {
  LayoutThreeColumnIcon,
  MoreHorizontalIcon,
  PlusSignIcon,
  TableIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { enabledFilters } from '@tamery/shared/filters'
import { pick } from '@tamery/shared/utils'
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
import { useMountedEffect } from '@tamery/ui/hookas/use-mounted-effect'
import { cn } from '@tamery/ui/lib/utils'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ComponentRef } from 'react'
import { createRef, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { PaneEmpty } from '~/components/pane-empty'
import { capabilitiesOf } from '~/core/catalog/capabilities'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import type { DataGridCell } from '~/core/table/cell/cursor'
import type { Column } from '~/core/table/cell/utils'
import { getColumnSize, INTERNAL_COLUMN_IDS } from '~/core/table/cell/utils'
import type { DataGridHandle } from '~/core/table/data-grid'
import { DataGrid } from '~/core/table/data-grid'
import {
  draftKey,
  draftsActions,
  getRowPrimaryKeysValues,
  newRowsActions,
  primaryKeysKey,
  useTableSessionStore,
} from '~/core/table/session'
import { TableError } from '~/core/table/table-error'

import { useTableColumnsContext } from '../../lib/columns'
import { useDraftHistory } from '../../lib/history'
import {
  isSameValue,
  useFlashChangedCells,
  useSyncSelectionWithRows,
} from '../../lib/hooks'
import { useReferenceLabels } from '../../lib/labels'
import { columnLayout, columnView, useTablePageStore } from '../../lib/store'
import { DistinctValues, hasDistinctValues } from './distinct-values'
import { RenameColumnDialog } from './rename-column-dialog'
import { SetValueDialog } from './set-value-dialog'
import { TableBodyCell } from './table-body-cell'
import { tableCellMenu } from './table-cell-menu'
import { TableFieldLabel, TableHeaderCell } from './table-header-cell'
import {
  LeadingCell,
  LeadingHeaderCell,
  useRowRangeKeys,
} from './table-selection'
import { DocumentsSkeleton, TableSkeleton } from './table-skeleton'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const tableGridRef = createRef<DataGridHandle>()

const TRAILING_COLUMN_SIZE = 48
const REFERENCE_BUTTON_WIDTH = 24

const defaultSize = (column: Column) =>
  (column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH) +
  (column.foreign ? REFERENCE_BUTTON_WIDTH : 0) +
  (column.references?.length ? REFERENCE_BUTTON_WIDTH : 0)

const referenceTriggerIn = (cell: Element | null | undefined) =>
  cell?.querySelector<HTMLElement>('[data-reference]')

const isFilledByDatabase = (column: Column) =>
  column.isGenerated || column.isIdentity

const cloneValues = (columns: Column[], row: GridRow) =>
  Object.fromEntries(
    columns
      .filter((column) => !column.primaryKey && !isFilledByDatabase(column))
      .map((column) => [column.id, row[column.id]])
  )

const TableComponent = ({
  onAddColumn,
  schema,
  table,
}: {
  onAddColumn: () => void
  schema: string
  table: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const { columns, isPending: isColumnsPending } = useTableColumnsContext()
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const {
    columnOrder,
    columnSizes,
    columnLabels,
    hiddenColumns,
    pinnedColumns,
  } = useSubscription(store, {
    selector: (state) =>
      pick(state, [
        'columnLabels',
        'columnOrder',
        'columnSizes',
        'hiddenColumns',
        'pinnedColumns',
      ]),
  })
  const activeFilters = useSubscription(store, {
    selector: (state) => state.filters,
  })
  const orderBy = useSubscription(store, { selector: (state) => state.orderBy })
  const view = useSubscription(store, { selector: (state) => state.view })
  const newRows = useSubscription(sessionStore, {
    selector: (state) => state.newRows,
  })
  const filters = enabledFilters(activeFilters)
  const {
    data: rows = [],
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isPending: isRowsPending,
  } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      connectionResource,
      query: { filters, orderBy },
      schema,
      table,
    })
  )
  const { data: isBaseTable } = useQuery({
    ...resourceTablesAndSchemasQueryOptions({ connectionResource }),
    select: (data) =>
      data.schemas
        .find((entry) => entry.name === schema)
        ?.tables.find((entry) => entry.name === table)?.type === 'table',
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const renameColumnRef = useRef<ComponentRef<typeof RenameColumnDialog>>(null)
  const [setting, setSetting] = useState<Column | null>(null)
  const selected = useSubscription(sessionStore, {
    selector: (state) => state.selected,
  })
  const [distinct, setDistinct] = useState<{
    anchor: Element
    column: Column
  } | null>(null)
  const gridRows = [...newRows.map((newRow) => newRow.values), ...rows]

  const { pinned, reordered, visible } = columnView(
    columns,
    { columnOrder, hiddenColumns, pinnedColumns },
    view === 'grid'
  )
  const primaryColumns = columns.filter((c) => c.primaryKey).map((c) => c.id)
  const isEditable = primaryColumns.length > 0
  const canInsert = isEditable && !!isBaseTable

  const insertRow = (values: Record<string, unknown>) => {
    newRowsActions(sessionStore).add(values)
    const column = visible.find((c) => !isFilledByDatabase(c)) ?? visible[0]
    if (column) {
      tableGridRef.current?.reveal({ column: column.id, row: 0 })
    }
  }

  const labels = useReferenceLabels(visible, gridRows, columnLabels)

  useSyncSelectionWithRows(rows, primaryColumns)
  useFlashChangedCells(rows, primaryColumns)
  useDraftHistory(scrollRef)

  useMountedEffect(() => {
    scrollRef.current?.scrollTo({ behavior: 'smooth', top: 0 })
  }, [activeFilters, orderBy])

  const keysOf = (row: GridRow) => getRowPrimaryKeysValues(row, primaryColumns)

  const valueOf = ({ column, row }: DataGridCell) => {
    const draft = isEditable
      ? sessionStore.get().drafts[draftKey(keysOf(row), column.id)]
      : undefined
    return draft ? draft.value : row[column.id]
  }

  const edit = ({ column, row, rowIndex }: DataGridCell, value: unknown) => {
    const newRow = sessionStore.get().newRows.at(rowIndex)
    if (newRow) {
      newRowsActions(sessionStore).setValue(newRow.id, column.id, value)
      return
    }
    const actions = draftsActions(sessionStore)
    if (isSameValue(value, row[column.id])) {
      actions.remove(keysOf(row), column.id)
      return
    }
    actions.upsert({
      columnId: column.id,
      error: undefined,
      isCommitting: false,
      primaryKeys: keysOf(row),
      value,
    })
  }

  const setInSelected = (column: Column, value: unknown) => {
    const picked = new Set(selected.map(primaryKeysKey))
    for (const [rowIndex, row] of gridRows.entries()) {
      if (picked.has(primaryKeysKey(keysOf(row)))) {
        edit({ column, row, rowIndex }, value)
      }
    }
  }

  const renameOf = (column: Column) =>
    capabilitiesOf(connection.type).renameColumns && !column.primaryKey
      ? () => renameColumnRef.current?.rename(schema, table, column.id)
      : undefined

  const columnActions = (column: Column) => ({
    onDistinctValues: hasDistinctValues(column)
      ? (anchor: Element) => setDistinct({ anchor, column })
      : undefined,
    onRename: renameOf(column),
    onSetSelected:
      isEditable && selected.length > 0 && column.isEditable !== false
        ? { count: selected.length, set: () => setSetting(column) }
        : undefined,
  })

  useRowRangeKeys({
    enabled: isEditable,
    hasCursor: () => !!tableGridRef.current?.hasCursor(),
    keys: primaryColumns,
    rows,
    target: scrollRef,
  })

  if (isRowsPending || isColumnsPending) {
    return view === 'documents' ? (
      <DocumentsSkeleton selectable={isEditable} />
    ) : (
      <TableSkeleton selectable={isEditable} />
    )
  }
  if (error) {
    return <TableError error={error} />
  }
  if (visible.length === 0) {
    return (
      <PaneEmpty
        icon={LayoutThreeColumnIcon}
        title="No columns to show"
        description="Every column is hidden. Show some from the Columns menu."
      />
    )
  }

  return (
    <div className="relative size-full">
      <DataGrid
        connectionType={connection.type}
        getValue={valueOf}
        onEdit={isEditable ? edit : undefined}
        onPreview={(_, element) => referenceTriggerIn(element)?.click()}
        renderCell={(cell, props) => (
          <TableBodyCell
            cell={cell}
            props={props}
            connectionType={connection.type}
            labels={labels.get(cell.column.id)}
            primaryColumns={primaryColumns}
          />
        )}
        renderLabel={(column) => (
          <TableFieldLabel column={column} {...columnActions(column)} />
        )}
        sizeOf={(column) => columnSizes[column.id] ?? defaultSize(column)}
        cursorRef={tableGridRef}
        layout={view}
        pinned={pinned}
        scrollRef={scrollRef}
        rows={gridRows}
        columns={visible}
        onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
        onReorder={(ids) => columnLayout(store).reorder(reordered(ids))}
        menuItems={(cell, element) => {
          const newRow = newRows.at(cell.rowIndex)
          const trigger = referenceTriggerIn(element)
          const editable = isEditable && cell.column.isEditable !== false
          const hasDraft =
            isEditable &&
            !newRow &&
            draftKey(keysOf(cell.row), cell.column.id) in
              sessionStore.get().drafts
          return tableCellMenu({
            column: cell.column,
            onDiscardChange: hasDraft
              ? () =>
                  draftsActions(sessionStore).remove(
                    keysOf(cell.row),
                    cell.column.id
                  )
              : undefined,
            onDiscardRow: newRow
              ? () => newRowsActions(sessionStore).remove(newRow.id)
              : undefined,
            onDuplicateRow: canInsert
              ? () => insertRow(cloneValues(columns, cell.row))
              : undefined,
            onPeek: trigger ? () => trigger.click() : undefined,
            onRename: renameOf(cell.column),
            onSetNull:
              editable && cell.column.isNullable
                ? () => edit(cell, null)
                : undefined,
            store,
            value: valueOf(cell),
          })
        }}
        renderHeader={(column, header) => (
          <TableHeaderCell
            column={column}
            header={header}
            {...columnActions(column)}
          />
        )}
        leading={
          isEditable
            ? {
                id: INTERNAL_COLUMN_IDS.SELECT,
                renderCell: ({ row, rowIndex, style }) => (
                  <LeadingCell
                    keys={rowIndex < newRows.length ? null : primaryColumns}
                    row={row}
                    rowIndex={rowIndex - newRows.length}
                    rows={rows}
                    // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
                    style={style}
                  />
                ),
                renderHeader: ({ style }) => (
                  <LeadingHeaderCell
                    keys={primaryColumns}
                    rows={rows}
                    // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
                    style={style}
                  />
                ),
                size: LEADING_COLUMN_SIZE,
              }
            : undefined
        }
        trailing={{
          id: INTERNAL_COLUMN_IDS.ACTIONS,
          // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
          renderCell: ({ style }) => <div aria-hidden style={style} />,
          renderHeader: ({ style }) => (
            // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
            <div className="flex items-center px-2" style={style}>
              {isBaseTable && (
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
        }}
        footer={
          gridRows.length > 0 && (
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
        }
      />
      {gridRows.length === 0 && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 flex',
            view === 'documents' ? 'top-0' : 'top-8'
          )}
        >
          <PaneEmpty
            icon={TableIcon}
            title="No rows"
            description={
              filters.length > 0
                ? 'Nothing matches the current filters.'
                : 'This table is empty.'
            }
          />
        </div>
      )}
      <RenameColumnDialog ref={renameColumnRef} />
      <SetValueDialog
        column={setting}
        count={selected.length}
        onClose={() => setSetting(null)}
        onSet={setInSelected}
      />
      <DistinctValues
        schema={schema}
        table={table}
        target={distinct}
        onClose={() => setDistinct(null)}
      />
    </div>
  )
}

export { TableComponent as Table }

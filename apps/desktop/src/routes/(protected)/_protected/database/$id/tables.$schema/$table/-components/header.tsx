import type { Dispatch, SetStateAction } from 'react'
import type { columnType, databaseRowsQuery } from '~/entities/database'
import { useParams } from '@tanstack/react-router'
import { useDatabase } from '~/entities/database'
import { useDatabaseTableTotal } from '~/entities/database/queries/total'
import { HeaderActions } from './header-actions'

export function Header({
  columns,
  selectedRows,
  setSelectedRows,
  rowsQueryOpts,
  setPage,
}: {
  columns: typeof columnType.infer[]
  selectedRows: Record<string, boolean>
  setSelectedRows: Dispatch<SetStateAction<Record<string, boolean>>>
  rowsQueryOpts: ReturnType<typeof databaseRowsQuery>
  setPage: Dispatch<SetStateAction<number>>
}) {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const columnsCount = columns.length
  const { data: total } = useDatabaseTableTotal(database, table, schema)

  return (
    <div className="flex gap-6 flex-row items-center justify-between p-4">
      <div>
        <h2 className="font-medium text-sm mb-0.5 space-x-1">
          <span className="text-muted-foreground">
            {schema}
          </span>
          {' '}
          <span className="text-muted-foreground/20">/</span>
          {' '}
          <span>{table}</span>
        </h2>
        <p className="text-muted-foreground text-xs">
          {columnsCount}
          {' '}
          column
          {columnsCount === 1 ? '' : 's'}
          {' '}
          •
          {' '}
          {total ?? '...'}
          {' '}
          row
          {total !== undefined && total !== 1 && 's'}
        </p>
      </div>
      <HeaderActions
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        rowsQueryOpts={rowsQueryOpts}
        setPage={setPage}
      />
    </div>
  )
}

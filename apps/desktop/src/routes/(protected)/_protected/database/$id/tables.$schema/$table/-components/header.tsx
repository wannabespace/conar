import { useParams } from '@tanstack/react-router'
import { useDatabase } from '~/entities/database'
import { useDatabaseTotal } from '~/entities/database/queries/total'
import { useTableContext } from '..'
import { HeaderActions } from './header-actions'

export function Header() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { columns } = useTableContext()
  const columnsCount = columns.length
  const { data: total } = useDatabaseTotal(database, table, schema)

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
      <HeaderActions />
    </div>
  )
}

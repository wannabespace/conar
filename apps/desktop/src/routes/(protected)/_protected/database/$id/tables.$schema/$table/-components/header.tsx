import { Input } from '@connnect/ui/components/input'
import { Separator } from '@connnect/ui/components/separator'
import { RiBardLine } from '@remixicon/react'
import { useParams } from '@tanstack/react-router'
import { useDatabase, useDatabaseTableTotal } from '~/entities/database'
import { useColumnsQuery } from '../-queries/use-columns-query'
import { HeaderActions } from './header-actions'

export function Header() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { data: columns } = useColumnsQuery()
  const { data: total } = useDatabaseTableTotal(database, table, schema)

  const columnsCount = columns.length

  return (
    <div className="flex gap-6 w-full items-center justify-between">
      <div className="flex gap-4 items-center">
        <div>
          <h2 className="font-medium text-sm mb-0.5 space-x-1">
            <span className="text-muted-foreground">
              {schema}
            </span>
            {' '}
            <span className="text-muted-foreground/20">/</span>
            {' '}
            <span data-mask>{table}</span>
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
        <Separator orientation="vertical" className="h-6!" />
        <div className="relative">
          <RiBardLine className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 w-72"
            placeholder="Ask AI to filter data..."
          />
        </div>
      </div>
      <HeaderActions />
    </div>
  )
}

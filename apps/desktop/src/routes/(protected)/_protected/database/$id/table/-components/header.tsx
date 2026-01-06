import { Separator } from '@conar/ui/components/separator'
import { Route } from '..'
import { useTableColumns } from '../-queries/use-columns-query'
import { TableRowCounter } from './estimate-row'
import { HeaderActions } from './header-actions'
import { HeaderSearch } from './header-search'

export function Header({ table, schema }: { table: string, schema: string }) {
  const { database } = Route.useLoaderData()
  const columns = useTableColumns({ database, table, schema })
  const columnsCount = columns?.length ?? 0

  return (
    <div className="flex w-full items-center justify-between gap-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="shrink-0">
          <h2 className="mb-0.5 space-x-1 text-sm font-medium">
            <span className="text-muted-foreground">
              {schema}
            </span>
            {' '}
            <span className="text-muted-foreground/20">/</span>
            <span data-mask>{table}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            <span className="tabular-nums">{columnsCount}</span>
            {' '}
            column
            {columnsCount === 1 ? '' : 's'}
            {' '}
            •
            <TableRowCounter schema={schema} table={table} database={database}/>
          </p>
        </div>
        <Separator orientation="vertical" className="h-6!" />
        <HeaderSearch table={table} schema={schema} />
      </div>
      <HeaderActions table={table} schema={schema} database={database} />
    </div>
  )
}

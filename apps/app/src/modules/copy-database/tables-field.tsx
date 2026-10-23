import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@tamery/ui/components/command'
import { FieldDescription } from '@tamery/ui/components/field'
import { useQuery } from '@tanstack/react-query'

import type { ConnectionResource } from '~/core/connection/sync'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { plural } from '~/utils/plural'

interface CopyTable {
  schema: string
  table: string
}

/** `null` is the whole database, which copies more than its tables. */
export type TableSelection = Map<string, CopyTable> | null

export const TablesField = ({
  onSelectionChange,
  resource,
  selection,
}: {
  onSelectionChange: (selection: TableSelection) => void
  resource: ConnectionResource
  selection: TableSelection
}) => {
  const { data } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource: resource })
  )
  const tables = new Map(
    data?.schemas.flatMap((schema) =>
      schema.tables
        .filter((table) => table.type === 'table' && !table.partition)
        .map((table): [string, CopyTable] => [
          JSON.stringify([schema.name, table.name]),
          { schema: schema.name, table: table.name },
        ])
    )
  )

  return (
    <>
      <div className="bg-popover ring-foreground/4 overflow-hidden rounded-xl ring">
        <Command variant="flat" label="Tables">
          <CommandInput variant="flat" placeholder="Search tables" />
          <CommandList>
            <CommandGroup>
              <CommandItem
                value="everything"
                keywords={['all']}
                data-checked={selection === null || undefined}
                onSelect={() =>
                  onSelectionChange(selection === null ? new Map() : null)
                }
              >
                Everything
              </CommandItem>
              {[...tables].map(([key, entry]) => (
                <CommandItem
                  key={key}
                  value={key}
                  keywords={[entry.schema, entry.table]}
                  data-checked={(selection?.has(key) ?? true) || undefined}
                  onSelect={() => {
                    const next = new Map(selection ?? tables)
                    if (next.has(key)) {
                      next.delete(key)
                    } else {
                      next.set(key, entry)
                    }
                    onSelectionChange(next)
                  }}
                >
                  <span data-mask className="min-w-0 truncate">
                    {entry.schema !== data?.defaultSchema && (
                      <span className="text-muted-foreground">
                        {entry.schema}.
                      </span>
                    )}
                    {entry.table}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
      <FieldDescription>
        {selection === null
          ? 'Schemas, types, functions, views and data.'
          : `${plural(selection.size, 'table')} with data, indexes and constraints. Types and functions they use must already be in the target.`}
      </FieldDescription>
    </>
  )
}

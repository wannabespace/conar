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

export interface CopyTable {
  schema: string
  table: string
}

/** `null` is the whole database, which copies more than its tables. */
export type TableSelection = Map<string, CopyTable> | null

const EVERYTHING = 'everything'

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
  const tables =
    data?.schemas.flatMap((schema) =>
      schema.tables
        .filter((table) => table.type === 'table')
        .map((table) => ({
          key: JSON.stringify([schema.name, table.name]),
          schema: schema.name,
          table: table.name,
        }))
    ) ?? []

  const toggle = ({ key, schema, table }: (typeof tables)[number]) => {
    const next = new Map(
      selection ??
        tables.map((entry) => [
          entry.key,
          { schema: entry.schema, table: entry.table },
        ])
    )
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.set(key, { schema, table })
    }
    onSelectionChange(next.size === tables.length ? null : next)
  }

  return (
    <>
      <div className="bg-card overflow-hidden rounded-xl border">
        <Command variant="flat" label="Tables">
          <CommandInput variant="flat" placeholder="Search tables" />
          <CommandList>
            <CommandGroup>
              <CommandItem
                value={EVERYTHING}
                keywords={['all']}
                data-checked={selection === null || undefined}
                onSelect={() =>
                  onSelectionChange(selection === null ? new Map() : null)
                }
              >
                Everything
              </CommandItem>
              {tables.map((entry) => (
                <CommandItem
                  key={entry.key}
                  value={entry.key}
                  keywords={[entry.schema, entry.table]}
                  data-checked={
                    (selection?.has(entry.key) ?? true) || undefined
                  }
                  onSelect={() => toggle(entry)}
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
          : `${plural(selection.size, 'table')} with their data, indexes and constraints. Types and functions they use must already be in the target.`}
      </FieldDescription>
    </>
  )
}

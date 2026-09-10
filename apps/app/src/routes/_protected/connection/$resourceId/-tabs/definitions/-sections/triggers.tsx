import { FlashIcon } from '@hugeicons/core-free-icons'
import { Badge } from '@tamery/ui/components/badge'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { TableCell, TableRow } from '@tamery/ui/components/table'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { resourceTriggersQueryOptions } from '~/entities/connection/queries/triggers'

import type { FilterOption } from '../-components/filter-select'
import { FilterSelect } from '../-components/filter-select'
import {
  DefinitionsHeader,
  DefinitionsList,
  DefinitionsToolbar,
  MutedCell,
  NameCell,
} from '../-components/page'
import { SchemaSelect } from '../-components/schema-select'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { matchesSearch } from '../-lib/search'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const eventOptions: FilterOption<string>[] = [
  { label: 'All events', value: 'all' },
  { label: 'Insert', value: 'INSERT' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Truncate', value: 'TRUNCATE' },
]

const timingOptions: FilterOption<string>[] = [
  { label: 'All timings', value: 'all' },
  { label: 'Before', value: 'BEFORE' },
  { label: 'After', value: 'AFTER' },
  { label: 'Instead of', value: 'INSTEAD OF' },
]

const titleCase = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase()

export const Triggers = () => {
  const { connectionResource } = useRouteContext()
  const { data: triggers = [], isPending } = useQuery(
    resourceTriggersQueryOptions({ connectionResource })
  )
  const { schemas, search, selectedSchema, setSearch, setSelectedSchema } =
    useDefinitionsState({ connectionResource })
  const [event, setEvent] = useState('all')
  const [timing, setTiming] = useState('all')

  const inSchema = triggers.filter((item) => item.schema === selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (event === 'all' || item.event.includes(event)) &&
      (timing === 'all' || timing === item.timing) &&
      matchesSearch(search, item.name, item.table, item.functionName)
  )

  return (
    <>
      <DefinitionsHeader
        title="Triggers"
        count={isPending ? undefined : rows.length}
        noun="trigger"
      />
      <DefinitionsToolbar
        placeholder="Search triggers"
        search={search}
        onSearchChange={setSearch}
      >
        <FilterSelect
          options={eventOptions}
          value={event}
          onValueChange={setEvent}
        />
        <FilterSelect
          options={timingOptions}
          value={timing}
          onValueChange={setTiming}
        />
        <SchemaSelect
          schemas={schemas}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
        />
      </DefinitionsToolbar>
      <DefinitionsList
        icon={FlashIcon}
        columns={['Name', 'Table', 'Timing', 'Event', 'Function']}
        count={rows.length}
        loading={isPending}
        emptyTitle={inSchema.length === 0 ? 'No triggers' : 'No matches'}
        emptyDescription={
          inSchema.length === 0
            ? 'This schema has no triggers.'
            : 'No triggers match the current search and filters.'
        }
      >
        {rows.map((item) => (
          <TableRow key={`${item.table}.${item.name}.${item.event}`}>
            <NameCell icon={FlashIcon}>
              <HighlightText text={item.name} match={search} />
              {item.enabled === false && (
                <Badge variant="destructive">Disabled</Badge>
              )}
            </NameCell>
            <TableCell data-mask>
              <HighlightText text={item.table} match={search} />
            </TableCell>
            <MutedCell>{titleCase(item.timing)}</MutedCell>
            <MutedCell>
              {item.event.split(' OR ').map(titleCase).join(', ')}
            </MutedCell>
            <TableCell
              data-mask
              className="font-mono text-xs whitespace-normal"
            >
              {item.functionName && (
                <HighlightText text={item.functionName} match={search} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </DefinitionsList>
    </>
  )
}

import { SourceCodeIcon } from '@hugeicons/core-free-icons'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { TableCell, TableRow } from '@tamery/ui/components/table'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import type { functionsType } from '~/entities/connection/queries/functions'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions'

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

type FunctionType = (typeof functionsType.infer)['type']

const typeLabels: Record<FunctionType, string> = {
  function: 'Function',
  procedure: 'Procedure',
}

const filterOptions: FilterOption<FunctionType | 'all'>[] = [
  { label: 'All types', value: 'all' },
  { label: 'Functions', value: 'function' },
  { label: 'Procedures', value: 'procedure' },
]

export const Functions = () => {
  const { connectionResource } = useRouteContext()
  const { data: functions = [], isPending } = useQuery(
    resourceFunctionsQueryOptions({ connectionResource })
  )
  const { schemas, search, selectedSchema, setSearch, setSelectedSchema } =
    useDefinitionsState({ connectionResource })
  const [type, setType] = useState<FunctionType | 'all'>('all')

  const inSchema = functions.filter((item) => item.schema === selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (type === 'all' || type === item.type) &&
      matchesSearch(search, item.name, item.language, item.return_type)
  )

  return (
    <>
      <DefinitionsHeader
        title="Functions"
        count={isPending ? undefined : rows.length}
        noun="function"
      />
      <DefinitionsToolbar
        placeholder="Search functions"
        search={search}
        onSearchChange={setSearch}
      >
        <FilterSelect
          options={filterOptions}
          value={type}
          onValueChange={setType}
        />
        <SchemaSelect
          schemas={schemas}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
        />
      </DefinitionsToolbar>
      <DefinitionsList
        icon={SourceCodeIcon}
        columns={['Name', 'Language', 'Returns', 'Arguments', 'Type']}
        count={rows.length}
        loading={isPending}
        emptyTitle={inSchema.length === 0 ? 'No functions' : 'No matches'}
        emptyDescription={
          inSchema.length === 0
            ? 'This schema has no functions.'
            : 'No functions match the current search and filters.'
        }
      >
        {rows.map((item) => (
          <TableRow
            key={`${item.name}.${item.type}.${item.argumentCount}.${item.return_type}`}
          >
            <NameCell icon={SourceCodeIcon}>
              <HighlightText text={item.name} match={search} />
            </NameCell>
            <MutedCell>
              {item.language && (
                <HighlightText text={item.language} match={search} />
              )}
            </MutedCell>
            <TableCell
              data-mask
              className="font-mono text-xs whitespace-normal"
            >
              {item.return_type && (
                <HighlightText text={item.return_type} match={search} />
              )}
            </TableCell>
            <MutedCell>
              <span className="tabular-nums">{item.argumentCount ?? 0}</span>
            </MutedCell>
            <MutedCell>{typeLabels[item.type]}</MutedCell>
          </TableRow>
        ))}
      </DefinitionsList>
    </>
  )
}

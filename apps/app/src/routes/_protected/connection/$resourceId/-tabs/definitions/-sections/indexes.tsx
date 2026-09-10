import { Key01Icon, LeftToRightListDashIcon } from '@hugeicons/core-free-icons'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { TableCell, TableRow } from '@tamery/ui/components/table'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import type { indexesType } from '~/entities/connection/queries/indexes'
import { resourceIndexesQueryOptions } from '~/entities/connection/queries/indexes'

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

type IndexItem = typeof indexesType.infer
type IndexKind = 'primary' | 'unique' | 'regular'

interface GroupedIndex extends Pick<IndexItem, 'name' | 'table' | 'type'> {
  columns: string[]
  kind: IndexKind
}

const kindOf = (item: IndexItem): IndexKind => {
  if (item.isPrimary) {
    return 'primary'
  }
  return item.isUnique ? 'unique' : 'regular'
}

const kindLabels: Record<IndexKind, string> = {
  primary: 'Primary key',
  regular: 'Index',
  unique: 'Unique',
}

const filterOptions: FilterOption<IndexKind | 'all'>[] = [
  { label: 'All types', value: 'all' },
  { label: 'Primary keys', value: 'primary' },
  { label: 'Unique', value: 'unique' },
  { label: 'Regular', value: 'regular' },
]

const groupIndexes = (indexes: IndexItem[], schema: string | undefined) => {
  const grouped = new Map<string, GroupedIndex>()

  for (const item of indexes) {
    if (item.schema !== schema) {
      continue
    }
    const key = `${item.table}.${item.name}`
    const column = item.column ?? item.customExpression
    const existing = grouped.get(key)

    if (existing) {
      if (column && !existing.columns.includes(column)) {
        existing.columns.push(column)
      }
    } else {
      grouped.set(key, {
        columns: column ? [column] : [],
        kind: kindOf(item),
        name: item.name,
        table: item.table,
        type: item.type,
      })
    }
  }

  return [...grouped.values()]
}

export const Indexes = () => {
  const { connectionResource } = useRouteContext()
  const { data: indexes = [], isPending } = useQuery(
    resourceIndexesQueryOptions({ connectionResource })
  )
  const { schemas, search, selectedSchema, setSearch, setSelectedSchema } =
    useDefinitionsState({ connectionResource })
  const [kind, setKind] = useState<IndexKind | 'all'>('all')

  const inSchema = groupIndexes(indexes, selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (kind === 'all' || kind === item.kind) &&
      matchesSearch(search, item.name, item.table, ...item.columns)
  )

  return (
    <>
      <DefinitionsHeader
        title="Indexes"
        count={isPending ? undefined : rows.length}
        noun="index"
      />
      <DefinitionsToolbar
        placeholder="Search indexes"
        search={search}
        onSearchChange={setSearch}
      >
        <FilterSelect
          options={filterOptions}
          value={kind}
          onValueChange={setKind}
        />
        <SchemaSelect
          schemas={schemas}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
        />
      </DefinitionsToolbar>
      <DefinitionsList
        icon={LeftToRightListDashIcon}
        columns={['Name', 'Table', 'Columns', 'Type']}
        count={rows.length}
        loading={isPending}
        emptyTitle={inSchema.length === 0 ? 'No indexes' : 'No matches'}
        emptyDescription={
          inSchema.length === 0
            ? 'This schema has no indexes.'
            : 'No indexes match the current search and filters.'
        }
      >
        {rows.map((item) => (
          <TableRow key={`${item.table}.${item.name}`}>
            <NameCell
              icon={
                item.kind === 'primary' ? Key01Icon : LeftToRightListDashIcon
              }
            >
              <HighlightText text={item.name} match={search} />
            </NameCell>
            <TableCell data-mask>
              <HighlightText text={item.table} match={search} />
            </TableCell>
            <TableCell
              data-mask
              className="font-mono text-xs whitespace-normal"
            >
              {item.columns.map((column, index) => (
                <span key={column}>
                  {index > 0 && ', '}
                  <HighlightText text={column} match={search} />
                </span>
              ))}
            </TableCell>
            <MutedCell>
              {kindLabels[item.kind]}
              {item.type && ` · ${item.type}`}
            </MutedCell>
          </TableRow>
        ))}
      </DefinitionsList>
    </>
  )
}

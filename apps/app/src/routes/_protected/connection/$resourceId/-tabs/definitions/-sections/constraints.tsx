import { Key01Icon, Link01Icon } from '@hugeicons/core-free-icons'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { TableCell, TableRow } from '@tamery/ui/components/table'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import type { constraintsType } from '~/entities/connection/queries/constraints'
import { resourceConstraintsQueryOptions } from '~/entities/connection/queries/constraints'

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

type ConstraintItem = typeof constraintsType.infer
type ConstraintType = ConstraintItem['type']

interface GroupedConstraint extends Pick<
  ConstraintItem,
  | 'foreignSchema'
  | 'foreignTable'
  | 'name'
  | 'onDelete'
  | 'onUpdate'
  | 'table'
  | 'type'
> {
  columns: string[]
  foreignColumns: string[]
}

const typeLabels: Record<ConstraintType, string> = {
  foreignKey: 'Foreign key',
  primaryKey: 'Primary key',
  unique: 'Unique',
}

const filterOptions: FilterOption<ConstraintType | 'all'>[] = [
  { label: 'All types', value: 'all' },
  { label: 'Primary keys', value: 'primaryKey' },
  { label: 'Foreign keys', value: 'foreignKey' },
  { label: 'Unique', value: 'unique' },
]

const DEFAULT_ACTION = 'NO ACTION'

const groupConstraints = (
  constraints: ConstraintItem[],
  schema: string | undefined
) => {
  const grouped = new Map<string, GroupedConstraint>()

  for (const item of constraints) {
    if (item.schema !== schema) {
      continue
    }
    const key = `${item.table}.${item.name}`
    const existing = grouped.get(key)

    if (existing) {
      if (item.column && !existing.columns.includes(item.column)) {
        existing.columns.push(item.column)
      }
      if (
        item.foreignColumn &&
        !existing.foreignColumns.includes(item.foreignColumn)
      ) {
        existing.foreignColumns.push(item.foreignColumn)
      }
    } else {
      grouped.set(key, {
        ...item,
        columns: item.column ? [item.column] : [],
        foreignColumns: item.foreignColumn ? [item.foreignColumn] : [],
      })
    }
  }

  return [...grouped.values()]
}

const referenceRules = (item: GroupedConstraint) =>
  [
    item.onDelete && item.onDelete !== DEFAULT_ACTION
      ? `on delete ${item.onDelete.toLowerCase()}`
      : null,
    item.onUpdate && item.onUpdate !== DEFAULT_ACTION
      ? `on update ${item.onUpdate.toLowerCase()}`
      : null,
  ]
    .filter(Boolean)
    .join(', ')

export const Constraints = () => {
  const { connectionResource } = useRouteContext()
  const { data: constraints = [], isPending } = useQuery(
    resourceConstraintsQueryOptions({ connectionResource })
  )
  const { schemas, search, selectedSchema, setSearch, setSelectedSchema } =
    useDefinitionsState({ connectionResource })
  const [type, setType] = useState<ConstraintType | 'all'>('all')

  const inSchema = groupConstraints(constraints, selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (type === 'all' || type === item.type) &&
      matchesSearch(
        search,
        item.name,
        item.table,
        item.foreignTable,
        ...item.columns
      )
  )

  return (
    <>
      <DefinitionsHeader
        title="Constraints"
        count={isPending ? undefined : rows.length}
        noun="constraint"
      />
      <DefinitionsToolbar
        placeholder="Search constraints"
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
        icon={Key01Icon}
        columns={['Name', 'Table', 'Columns', 'Type']}
        count={rows.length}
        loading={isPending}
        emptyTitle={inSchema.length === 0 ? 'No constraints' : 'No matches'}
        emptyDescription={
          inSchema.length === 0
            ? 'This schema has no constraints.'
            : 'No constraints match the current search and filters.'
        }
      >
        {rows.map((item) => {
          const rules = referenceRules(item)

          return (
            <TableRow key={`${item.table}.${item.name}`}>
              <NameCell
                icon={item.type === 'foreignKey' ? Link01Icon : Key01Icon}
              >
                <HighlightText text={item.name} match={search} />
              </NameCell>
              <TableCell data-mask>
                <HighlightText text={item.table} match={search} />
              </TableCell>
              <TableCell data-mask className="whitespace-normal">
                <span className="font-mono text-xs">
                  {item.columns.map((column, index) => (
                    <span key={column}>
                      {index > 0 && ', '}
                      <HighlightText text={column} match={search} />
                    </span>
                  ))}
                </span>
                {item.foreignTable && (
                  <span className="text-muted-foreground">
                    {' → '}
                    <HighlightText
                      text={
                        item.foreignSchema &&
                        item.foreignSchema !== selectedSchema
                          ? `${item.foreignSchema}.${item.foreignTable}`
                          : item.foreignTable
                      }
                      match={search}
                    />
                    <span className="font-mono text-xs">
                      {' '}
                      ({item.foreignColumns.join(', ')})
                    </span>
                    {rules && <span className="text-xs"> · {rules}</span>}
                  </span>
                )}
              </TableCell>
              <MutedCell>{typeLabels[item.type]}</MutedCell>
            </TableRow>
          )
        })}
      </DefinitionsList>
    </>
  )
}

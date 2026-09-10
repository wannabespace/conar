import { SecurityCheckIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@tamery/ui/components/badge'
import { CodeInline } from '@tamery/ui/components/custom/code-block'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { TableCell, TableRow } from '@tamery/ui/components/table'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import type { policyType } from '~/entities/connection/queries/policies'
import { resourcePoliciesQuery } from '~/entities/connection/queries/policies'

import type { FilterOption } from '../-components/filter-select'
import { FilterSelect } from '../-components/filter-select'
import {
  DefinitionsHeader,
  DefinitionsList,
  DefinitionsToolbar,
  MutedCell,
} from '../-components/page'
import { SchemaSelect } from '../-components/schema-select'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { matchesSearch } from '../-lib/search'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

type PolicyType = (typeof policyType.infer)['type']

const typeLabels: Record<PolicyType, string> = {
  PERMISSIVE: 'Permissive',
  RESTRICTIVE: 'Restrictive',
}

const filterOptions: FilterOption<PolicyType | 'all'>[] = [
  { label: 'All types', value: 'all' },
  { label: 'Permissive', value: 'PERMISSIVE' },
  { label: 'Restrictive', value: 'RESTRICTIVE' },
]

const Expression = ({ keyword, value }: { keyword: string; value: string }) => (
  <span className="flex items-baseline gap-1.5 text-xs">
    <span className="text-muted-foreground shrink-0">{keyword}</span>
    <CodeInline data-mask code={value} language="sql" />
  </span>
)

export const Policies = () => {
  const { connectionResource } = useRouteContext()
  const { data: policies = [], isPending } = useQuery(
    resourcePoliciesQuery({ connectionResource })
  )
  const { schemas, search, selectedSchema, setSearch, setSelectedSchema } =
    useDefinitionsState({ connectionResource })
  const [type, setType] = useState<PolicyType | 'all'>('all')

  const inSchema = policies.filter((item) => item.schema === selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (type === 'all' || type === item.type) &&
      matchesSearch(search, item.name, item.table, item.command, ...item.roles)
  )

  return (
    <>
      <DefinitionsHeader
        title="Policies"
        count={isPending ? undefined : rows.length}
        noun="policy"
      />
      <DefinitionsToolbar
        placeholder="Search policies"
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
        icon={SecurityCheckIcon}
        columns={['Name', 'Table', 'Command', 'Roles', 'Type']}
        count={rows.length}
        loading={isPending}
        emptyTitle={inSchema.length === 0 ? 'No policies' : 'No matches'}
        emptyDescription={
          inSchema.length === 0
            ? 'This schema has no policies.'
            : 'No policies match the current search and filters.'
        }
      >
        {rows.map((item) => (
          <TableRow key={`${item.table}.${item.name}`}>
            <TableCell className="w-full whitespace-normal">
              <span className="flex flex-col gap-1">
                <span data-mask className="flex items-center gap-2 font-medium">
                  <HugeiconsIcon
                    icon={
                      item.type === 'RESTRICTIVE'
                        ? ViewOffSlashIcon
                        : SecurityCheckIcon
                    }
                    strokeWidth={2}
                    className="text-muted-foreground size-4 shrink-0"
                  />
                  <HighlightText text={item.name} match={search} />
                  {!item.enabled && (
                    <Badge variant="destructive">Disabled</Badge>
                  )}
                </span>
                {item.using && (
                  <Expression keyword="USING" value={item.using} />
                )}
                {item.check && (
                  <Expression keyword="WITH CHECK" value={item.check} />
                )}
              </span>
            </TableCell>
            <TableCell data-mask>
              <HighlightText text={item.table} match={search} />
            </TableCell>
            <MutedCell>{item.command}</MutedCell>
            <TableCell data-mask className="text-muted-foreground">
              {item.roles.map((role, index) => (
                <span key={role}>
                  {index > 0 && ', '}
                  <HighlightText text={role} match={search} />
                </span>
              ))}
            </TableCell>
            <MutedCell>{typeLabels[item.type]}</MutedCell>
          </TableRow>
        ))}
      </DefinitionsList>
    </>
  )
}

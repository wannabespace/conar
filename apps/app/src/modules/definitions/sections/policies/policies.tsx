import { SecurityCheckIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { matchesSearch } from '@tamery/shared/utils'
import { Badge } from '@tamery/ui/components/badge'
import { CodeInline } from '@tamery/ui/components/custom/code-block'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { useQuery } from '@tanstack/react-query'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { definitionKey } from '~/core/catalog/definition-keys'
import { resourceFunctionsQueryOptions } from '~/core/queries/functions/list'
import { dropPolicyQuery } from '~/core/queries/policies/drop'
import { resourcePoliciesQueryOptions } from '~/core/queries/policies/list'
import type { PolicyKind } from '~/core/queries/policies/shape'

import { DefinitionsPage } from '../../components/page'
import { useDefinitionsState } from '../../hooks/use-definitions-state'
import { useFilter } from '../../hooks/use-filter'
import type { DefinitionsColumn } from '../../lib/columns'
import { labelColumn, textColumn } from '../../lib/columns'
import type { PolicyItem } from './policy-draft'
import { kindLabels, kinds } from './policy-draft'
import { PolicyInspector } from './policy-inspector'
import { PredicatePolicyInspector } from './predicate-policy-inspector'

const PolicyName = ({
  icon = SecurityCheckIcon,
  item,
  search,
}: {
  icon?: typeof SecurityCheckIcon
  item: PolicyItem
  search: string
}) => (
  <span className="flex items-center gap-2">
    <HugeiconsIcon
      icon={icon}
      strokeWidth={2}
      className="text-muted-foreground size-4 shrink-0"
    />
    <span data-mask>
      <HighlightText text={item.name} match={search} />
    </span>
    {!item.enabled && <Badge variant="destructive">Disabled</Badge>}
  </span>
)

const Expression = ({ keyword, value }: { keyword: string; value: string }) => (
  <span className="flex items-baseline gap-1.5 text-xs">
    <span className="text-muted-foreground shrink-0">{keyword}</span>
    <CodeInline data-mask code={value} language="sql" />
  </span>
)

const columns: DefinitionsColumn<PolicyItem>[] = [
  {
    cell: (item, { search }) => (
      <span className="flex flex-col gap-1">
        <PolicyName
          icon={
            item.type === 'RESTRICTIVE' ? ViewOffSlashIcon : SecurityCheckIcon
          }
          item={item}
          search={search}
        />
        {item.using && <Expression keyword="USING" value={item.using} />}
        {item.check && <Expression keyword="WITH CHECK" value={item.check} />}
      </span>
    ),
    header: 'Name',
  },
  textColumn({
    header: 'Table',
    valueOf: (item: PolicyItem) => item.table,
    width: 'w-2/12',
  }),
  labelColumn({
    header: 'Command',
    labelOf: (item: PolicyItem) => item.command,
    width: 'w-2/12',
  }),
  labelColumn({
    header: 'Roles',
    labelOf: (item: PolicyItem, { search }) => (
      <span data-mask>
        <HighlightText text={item.roles.join(', ')} match={search} />
      </span>
    ),
    width: 'w-2/12',
  }),
  labelColumn({
    align: 'end',
    header: 'Type',
    labelOf: (item: PolicyItem) => kindLabels[item.type],
    width: 'w-2/12',
  }),
]

const predicateColumns: DefinitionsColumn<PolicyItem>[] = [
  {
    cell: (item, { search }) => (
      <span className="flex flex-col gap-1">
        <PolicyName item={item} search={search} />
        {item.predicates?.map((predicate, index) => (
          <Expression
            key={index}
            keyword={[predicate.kind, predicate.operation]
              .filter(Boolean)
              .join(' ')}
            value={`${predicate.definition} ON ${predicate.schema}.${predicate.table}`}
          />
        ))}
      </span>
    ),
    header: 'Name',
  },
  textColumn({
    header: 'Tables',
    valueOf: (item: PolicyItem) => item.table,
    width: 'w-3/12',
  }),
]

export const Policies = () => {
  const state = useDefinitionsState({ section: 'policies' })
  const {
    connectionResource,
    relationNamesOf,
    run,
    schemas,
    search,
    selectedSchema,
  } = state
  const { predicates } = capabilitiesOf(state.type).policies
  const query = resourcePoliciesQueryOptions({ connectionResource })
  const { data: policies = [], isPending } = useQuery(query)
  const { data: functions = [], isPending: functionsPending } = useQuery({
    ...resourceFunctionsQueryOptions({ connectionResource }),
    enabled: predicates,
  })
  const kindFilter = useFilter<PolicyKind>(
    'All types',
    kinds.map((kind) => ({ label: kindLabels[kind], value: kind }))
  )

  const inSchema = policies.filter((item) => item.schema === selectedSchema)
  const matches = (item: PolicyItem) =>
    kindFilter.matches(item.type) &&
    matchesSearch(search, item.name, item.table, item.command, ...item.roles)
  const dropItem = (item: PolicyItem) =>
    run(
      dropPolicyQuery({
        name: item.name,
        schema: item.schema,
        table: item.table,
      })
    )
  const createBlocked = (() => {
    if (!predicates) {
      return relationNamesOf(selectedSchema ?? '', 'table').length === 0
        ? 'This schema has no tables to protect.'
        : undefined
    }
    if (
      schemas.every((schema) => relationNamesOf(schema, 'table').length === 0)
    ) {
      return 'This database has no tables to protect.'
    }

    return functionsPending ||
      functions.some((fn) => fn.inline && fn.schemaBound)
      ? undefined
      : 'A policy calls a schema-bound inline table-valued function, and none exists yet.'
  })()

  return (
    <DefinitionsPage
      columns={predicates ? predicateColumns : columns}
      createBlocked={createBlocked}
      dropItem={dropItem}
      Inspector={predicates ? PredicatePolicyInspector : PolicyInspector}
      items={inSchema}
      keyOf={definitionKey.policy}
      loading={isPending}
      match={matches}
      queryKey={query.queryKey}
      state={state}
      toolbar={predicates ? undefined : kindFilter.control}
    />
  )
}

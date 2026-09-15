import { SecurityCheckIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@tamery/ui/components/badge'
import { CodeInline } from '@tamery/ui/components/custom/code-block'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { FieldDescription } from '@tamery/ui/components/field'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { alterPolicyQuery } from '~/entities/connection/queries/policies/alter'
import { createPolicyQuery } from '~/entities/connection/queries/policies/create'
import { dropPolicyQuery } from '~/entities/connection/queries/policies/drop'
import type { policyType } from '~/entities/connection/queries/policies/list'
import { resourcePoliciesQueryOptions } from '~/entities/connection/queries/policies/list'
import { recreatePolicyQuery } from '~/entities/connection/queries/policies/recreate'
import { renamePolicyQuery } from '~/entities/connection/queries/policies/rename'
import type {
  PolicyCommand,
  PolicyKind,
} from '~/entities/connection/queries/policies/shape'
import { POLICY_COMMANDS } from '~/entities/connection/queries/policies/shape'

import type { FilterOption } from '../-components/filter-select'
import { FilterSelect } from '../-components/filter-select'
import type {
  InspectorWarning,
  SectionInspectorProps,
} from '../-components/inspector'
import {
  InspectorHeader,
  InspectorFooter,
  InspectorSection,
  InspectorSections,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { NameSelect } from '../-components/pickers'
import { SchemaField } from '../-components/schema-select'
import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
import type { RunQuery } from '../-hooks/use-definitions-state'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import type { DefinitionsColumn } from '../-lib/columns'
import { HighlightList, Muted, monoColumn } from '../-lib/columns'
import { matchesSearch } from '../-lib/search'

type PolicyItem = typeof policyType.infer

const kindLabels: Record<PolicyKind, string> = {
  PERMISSIVE: 'Permissive',
  RESTRICTIVE: 'Restrictive',
}

const kinds = Object.keys(kindLabels) as PolicyKind[]

const filterOptions: FilterOption<PolicyKind | 'all'>[] = [
  { label: 'All types', value: 'all' },
  ...kinds.map((kind) => ({ label: kindLabels[kind], value: kind })),
]

const policyKey = (item: PolicyItem) => `${item.table}.${item.name}`

const parseRoles = (value: string) =>
  value
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean)

interface PolicyDraft {
  check: string
  command: PolicyCommand
  kind: PolicyKind
  name: string
  roles: string
  schema: string
  table: string
  using: string
}

const asCommand = (value: string | undefined): PolicyCommand =>
  POLICY_COMMANDS.find((command) => command === value) ?? 'ALL'

// PostgreSQL takes USING for rows that exist and WITH CHECK for rows a write
// would produce, so INSERT has no USING and SELECT and DELETE no WITH CHECK.
const expressionsFor = (command: PolicyCommand) => ({
  check: command !== 'SELECT' && command !== 'DELETE',
  using: command !== 'INSERT',
})

const withAllowedExpressions = (draft: PolicyDraft): PolicyDraft => {
  const allowed = expressionsFor(draft.command)

  return {
    ...draft,
    check: allowed.check ? draft.check : '',
    using: allowed.using ? draft.using : '',
  }
}

const draftOf = (item: PolicyItem | null, pageSchema: string): PolicyDraft => ({
  check: item?.check ?? '',
  command: asCommand(item?.command),
  kind: item?.type ?? 'PERMISSIVE',
  name: item?.name ?? '',
  roles: item?.roles.join(', ') ?? '',
  schema: item?.schema ?? pageSchema,
  table: item?.table ?? '',
  using: item?.using ?? '',
})

const changesOf = (item: PolicyItem, draft: PolicyDraft) => {
  const check = draft.check.trim()
  const using = draft.using.trim()
  const roles = parseRoles(draft.roles)

  return {
    check: check === (item.check ?? '') ? null : check,
    name: draft.name.trim() === item.name ? null : draft.name.trim(),
    roles: roles.join(',') === item.roles.join(',') ? null : roles,
    using: using === (item.using ?? '') ? null : using,
  }
}

// ALTER POLICY has no form that removes an expression the policy already has.
const clearsExpression = (item: PolicyItem, draft: PolicyDraft) =>
  (item.using !== null && draft.using.trim() === '') ||
  (item.check !== null && draft.check.trim() === '')

const replaces = (item: PolicyItem, draft: PolicyDraft) =>
  draft.command !== asCommand(item.command) ||
  draft.kind !== item.type ||
  clearsExpression(item, draft)

const policyErrors = (draft: PolicyDraft) => ({
  name: draft.name.trim() === '' ? 'Give the policy a name.' : undefined,
  table: draft.table === '' ? 'Pick the table to protect.' : undefined,
})

const policyChanged = (item: PolicyItem | null, draft: PolicyDraft) =>
  item
    ? replaces(item, draft) ||
      Object.values(changesOf(item, draft)).some((change) => change !== null)
    : true

const replaceWarning = (
  item: PolicyItem | null,
  cleared: boolean
): InspectorWarning => ({
  action: 'Replace policy',
  description: cleared ? (
    <>
      A policy cannot have an expression removed in place, so{' '}
      <span data-mask className="font-medium">
        {item?.name}
      </span>{' '}
      is dropped and created again without it. The table is left without the
      policy until the new one exists.
    </>
  ) : (
    <>
      A policy cannot move between commands or between permissive and
      restrictive, so{' '}
      <span data-mask className="font-medium">
        {item?.name}
      </span>{' '}
      is dropped and created again. The table is left without it until the new
      policy exists.
    </>
  ),
})

const savePolicy = async ({
  draft,
  item,
  run,
}: {
  draft: PolicyDraft
  item: PolicyItem | null
  run: RunQuery
}) => {
  const shape = {
    check: draft.check.trim() || null,
    command: draft.command,
    kind: draft.kind,
    name: draft.name.trim(),
    roles: parseRoles(draft.roles),
    using: draft.using.trim() || null,
  }

  if (!item) {
    await run(
      createPolicyQuery({ schema: draft.schema, shape, table: draft.table })
    )
    return
  }
  const target = { name: item.name, schema: item.schema, table: item.table }

  if (replaces(item, draft)) {
    await run(recreatePolicyQuery({ ...target, shape }))
    return
  }

  const changes = changesOf(item, draft)

  if (changes.roles || changes.using || changes.check) {
    await run(
      alterPolicyQuery({
        ...target,
        check: changes.check,
        roles: changes.roles,
        using: changes.using,
      })
    )
  }
  if (changes.name) {
    await run(renamePolicyQuery({ ...target, newName: changes.name }))
  }
}

const Expression = ({ keyword, value }: { keyword: string; value: string }) => (
  <span className="flex items-baseline gap-1.5 text-xs">
    <span className="text-muted-foreground shrink-0">{keyword}</span>
    <CodeInline data-mask code={value} language="sql" />
  </span>
)

const PolicyInspector = ({
  can,
  item,
  onOpenChange,
  queryKey,
  run,
  schemas,
  selectedSchema,
  tablesOf,
}: SectionInspectorProps<PolicyItem>) => {
  const readOnly = item ? !can.edit : !can.create
  const mutation = useDefinitionMutation({
    mutationFn: (draft: PolicyDraft) => savePolicy({ draft, item, run }),
    onSuccess: () => onOpenChange(false),
    queryKey,
    success: (draft) =>
      `Policy "${draft.name.trim()}" ${item ? 'saved' : 'created'}`,
  })
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? ''),
    onSubmit: ({ value }) => {
      mutation.mutate(withAllowedExpressions(value))
    },
    validators: {
      onChange: ({ value }) => ({ fields: policyErrors(value) }),
      onMount: ({ value }) => ({ fields: policyErrors(value) }),
    },
  })
  const draft = withAllowedExpressions(
    useStore(form.store, (state) => state.values)
  )
  const expressions = expressionsFor(draft.command)
  const replacing = !!item && replaces(item, draft)

  return (
    <>
      <InspectorHeader
        description={item ? `${item.schema}.${item.table}` : draft.schema}
        title={item ? item.name : 'New policy'}
      />
      <InspectorSections>
        <InspectorSection
          title="General"
          description="A policy decides which rows a role may see or write."
        >
          <form.AppField name="schema">
            {(field) => (
              <SchemaField
                id={field.name}
                disabled={readOnly || !!item}
                schema={field.state.value}
                schemas={schemas}
                onSchemaChange={(next) => {
                  field.handleChange(next)
                  form.setFieldValue('table', '', { dontUpdateMeta: true })
                }}
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {(field) => (
              <field.Field>
                <field.Label>Name</field.Label>
                <field.Input
                  data-mask
                  autoFocus
                  disabled={readOnly}
                  spellCheck={false}
                  autoComplete="off"
                />
              </field.Field>
            )}
          </form.AppField>
          <form.AppField name="table">
            {(field) => (
              <field.Field>
                <field.Label>Table</field.Label>
                <NameSelect
                  id={field.name}
                  disabled={readOnly || !!item}
                  options={item ? [item.table] : tablesOf(draft.schema)}
                  placeholder="Choose a table"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
                <FieldDescription>
                  The policy only applies while row level security is enabled on
                  this table.
                </FieldDescription>
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Scope"
          description="Which statements the policy answers for, and who it answers for."
        >
          <div className="grid grid-cols-2 gap-3">
            <form.AppField name="command">
              {(field) => (
                <field.Field>
                  <field.Label>Command</field.Label>
                  <NameSelect
                    id={field.name}
                    disabled={readOnly}
                    options={POLICY_COMMANDS}
                    placeholder="Command"
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  />
                </field.Field>
              )}
            </form.AppField>
            <form.AppField name="kind">
              {(field) => (
                <field.Field>
                  <field.Label>Type</field.Label>
                  <NameSelect
                    id={field.name}
                    disabled={readOnly}
                    options={kinds}
                    labelOf={(value) => kindLabels[value]}
                    placeholder="Type"
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  />
                </field.Field>
              )}
            </form.AppField>
          </div>
          <FieldDescription>
            Permissive policies widen access, restrictive ones narrow it — every
            restrictive policy must also pass.
          </FieldDescription>
          <form.AppField name="roles">
            {(field) => (
              <field.Field>
                <field.Label>Roles</field.Label>
                <field.Input
                  data-mask
                  disabled={readOnly}
                  placeholder="public"
                  spellCheck={false}
                  autoComplete="off"
                />
                <FieldDescription>
                  Comma-separated. Empty means PUBLIC.
                </FieldDescription>
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Expressions"
          description="SQL returning true for the rows the policy allows."
        >
          <form.AppField name="using">
            {(field) => (
              <field.Field>
                <field.Label>Using</field.Label>
                <field.Textarea
                  data-mask
                  mono
                  disabled={readOnly || !expressions.using}
                  placeholder="user_id = auth.uid()"
                  spellCheck={false}
                />
                <FieldDescription>
                  {expressions.using
                    ? 'Checked against rows that already exist.'
                    : 'An insert has no existing rows to check.'}
                </FieldDescription>
              </field.Field>
            )}
          </form.AppField>
          <form.AppField name="check">
            {(field) => (
              <field.Field>
                <field.Label>With check</field.Label>
                <field.Textarea
                  data-mask
                  mono
                  disabled={readOnly || !expressions.check}
                  placeholder="user_id = auth.uid()"
                  spellCheck={false}
                />
                <FieldDescription>
                  {expressions.check
                    ? 'Checked against rows an insert or update would write.'
                    : `A ${draft.command.toLowerCase()} writes no rows to check.`}
                </FieldDescription>
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
      </InspectorSections>
      <InspectorFooter
        canSave={policyChanged(item, draft)}
        warning={
          replacing
            ? replaceWarning(item, !!item && clearsExpression(item, draft))
            : undefined
        }
        error={mutation.error}
        form={form}
        readOnly={readOnly}
        saveLabel={item ? 'Save' : 'Create policy'}
        saving={mutation.isPending}
      />
    </>
  )
}

const columns: DefinitionsColumn<PolicyItem>[] = [
  {
    cell: (item, { search }) => (
      <span className="flex flex-col gap-1">
        <span data-mask className="flex items-center gap-2 font-medium">
          <HugeiconsIcon
            icon={
              item.type === 'RESTRICTIVE' ? ViewOffSlashIcon : SecurityCheckIcon
            }
            strokeWidth={2}
            className="text-muted-foreground size-4 shrink-0"
          />
          <HighlightText text={item.name} match={search} />
          {!item.enabled && <Badge variant="destructive">Disabled</Badge>}
        </span>
        {item.using && <Expression keyword="USING" value={item.using} />}
        {item.check && <Expression keyword="WITH CHECK" value={item.check} />}
      </span>
    ),
    className: 'whitespace-normal',
    grow: true,
    header: 'Name',
  },
  monoColumn({
    header: 'Table',
    valueOf: (item: PolicyItem) => item.table,
    width: 'w-44',
  }),
  {
    cell: (item) => <Muted>{item.command}</Muted>,
    header: 'Command',
    width: 'w-32',
  },
  {
    cell: (item, { search }) => (
      <span data-mask className="text-muted-foreground font-mono">
        <HighlightList values={item.roles} match={search} />
      </span>
    ),
    header: 'Roles',
    width: 'w-48',
  },
  {
    align: 'end',
    cell: (item) => <Muted>{kindLabels[item.type]}</Muted>,
    header: 'Type',
    width: 'w-36',
  },
]

export const Policies = () => {
  const state = useDefinitionsState({ section: 'policies' })
  const { run, search, selectedSchema } = state
  const query = resourcePoliciesQueryOptions({
    connectionResource: state.connectionResource,
  })
  const { data: policies = [], isPending } = useQuery(query)
  const [type, setType] = useState<PolicyKind | 'all'>('all')

  const inSchema = policies.filter((item) => item.schema === selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (type === 'all' || type === item.type) &&
      matchesSearch(search, item.name, item.table, item.command, ...item.roles)
  )

  return (
    <DefinitionsPage
      title="Policies"
      noun="policy"
      icon={SecurityCheckIcon}
      items={rows}
      inSchema={inSchema.length}
      loading={isPending}
      keyOf={policyKey}
      columns={columns}
      state={state}
      toolbar={
        <FilterSelect
          options={filterOptions}
          value={type}
          onValueChange={setType}
        />
      }
      queryKey={query.queryKey}
      dropItem={(item) =>
        run(
          dropPolicyQuery({
            name: item.name,
            schema: item.schema,
            table: item.table,
          })
        )
      }
      Inspector={PolicyInspector}
      inspectorProps={state}
    />
  )
}

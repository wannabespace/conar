import { SecurityCheckIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { matchesSearch } from '@tamery/shared/utils/helpers'
import { Badge } from '@tamery/ui/components/badge'
import { CodeInline } from '@tamery/ui/components/custom/code-block'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { FieldDescription } from '@tamery/ui/components/field'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type as arkType } from 'arktype'
import { toast } from 'sonner'

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
import { queryClient } from '~/lib/query-client'

import {
  resetFields,
  SchemaField,
  SelectField,
  SqlField,
  TextField,
} from '../-components/fields'
import type {
  InspectorWarning,
  SectionInspectorProps,
} from '../-components/inspector'
import {
  InspectorFooter,
  InspectorHeader,
  InspectorSection,
  InspectorSections,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import type { RunQuery } from '../-hooks/use-definitions-state'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { useFilter } from '../-hooks/use-filter'
import type { DefinitionsColumn } from '../-lib/columns'
import { labelColumn, textColumn } from '../-lib/columns'

type PolicyItem = typeof policyType.infer

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

const kindLabels: Record<PolicyKind, string> = {
  PERMISSIVE: 'Permissive',
  RESTRICTIVE: 'Restrictive',
}

const kinds = Object.keys(kindLabels) as PolicyKind[]

const parseRoles = (value: string) =>
  value
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean)

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

const policySchema = arkType({
  name: arkType(/\S/u).configure({ message: 'Give the policy a name.' }),
  table: arkType(/\S/u).configure({ message: 'Pick the table to protect.' }),
})

const replaceWarning = (
  item: PolicyItem,
  draft: PolicyDraft
): InspectorWarning => ({
  action: 'Replace policy',
  description: (
    <>
      {clearsExpression(item, draft)
        ? 'An expression cannot come off a policy in place, so we recreate '
        : 'Command and permissive/restrictive cannot change in place, so we recreate '}
      <span data-mask className="font-medium">
        {item.name}
      </span>
      . The table runs unprotected in between.
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
  const mutation = useMutation({
    mutationFn: (draft: PolicyDraft) => savePolicy({ draft, item, run }),
    onSuccess: async (_result, draft) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Policy "${draft.name.trim()}" ${item ? 'saved' : 'created'}`
      )
      onOpenChange(false)
    },
  })
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? ''),
    onSubmit: ({ value }) => {
      mutation.mutate(withAllowedExpressions(value))
    },
    validators: { onChange: policySchema, onMount: policySchema },
  })
  const draft = withAllowedExpressions(
    useStore(form.store, (state) => state.values)
  )

  const readOnly = item ? !can.edit : !can.create
  const expressions = expressionsFor(draft.command)
  const replacing = !!item && replaces(item, draft)
  const changed =
    !item ||
    replacing ||
    Object.values(changesOf(item, draft)).some((change) => change !== null)

  return (
    <>
      <InspectorHeader
        description={item ? `${item.schema}.${item.table}` : draft.schema}
        item={item}
        noun="policy"
      />
      <InspectorSections>
        <InspectorSection
          title="General"
          description="A policy decides which rows a role may see or write."
        >
          <form.AppField name="schema">
            {() => (
              <SchemaField
                disabled={readOnly || !!item}
                schemas={schemas}
                onChanged={() => resetFields(form, { table: '' })}
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {() => <TextField label="Name" autoFocus disabled={readOnly} />}
          </form.AppField>
          <form.AppField name="table">
            {() => (
              <SelectField
                label="Table"
                description="The policy only applies while row level security is enabled on this table."
                disabled={readOnly || !!item}
                options={item ? [item.table] : tablesOf(draft.schema)}
                placeholder="Choose a table"
              />
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Scope"
          description="Which statements the policy answers for, and who it answers for."
        >
          <div className="grid grid-cols-2 gap-3">
            <form.AppField name="command">
              {() => (
                <SelectField
                  label="Command"
                  disabled={readOnly}
                  options={POLICY_COMMANDS}
                  placeholder="Command"
                />
              )}
            </form.AppField>
            <form.AppField name="kind">
              {() => (
                <SelectField
                  label="Type"
                  disabled={readOnly}
                  options={kinds}
                  labelOf={(value) => kindLabels[value]}
                  placeholder="Type"
                />
              )}
            </form.AppField>
          </div>
          <FieldDescription>
            Permissive policies widen access, restrictive ones narrow it — every
            restrictive policy must also pass.
          </FieldDescription>
          <form.AppField name="roles">
            {() => (
              <TextField
                label="Roles"
                description="Comma-separated. Empty means PUBLIC."
                disabled={readOnly}
                placeholder="public"
              />
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Expressions"
          description="SQL returning true for the rows the policy allows."
        >
          <form.AppField name="using">
            {() => (
              <SqlField
                label="Using"
                description={
                  expressions.using
                    ? 'Checked against rows that already exist.'
                    : 'An insert has no existing rows to check.'
                }
                disabled={readOnly || !expressions.using}
                placeholder="user_id = auth.uid()"
              />
            )}
          </form.AppField>
          <form.AppField name="check">
            {() => (
              <SqlField
                label="With check"
                description={
                  expressions.check
                    ? 'Checked against rows an insert or update would write.'
                    : `A ${draft.command.toLowerCase()} writes no rows to check.`
                }
                disabled={readOnly || !expressions.check}
                placeholder="user_id = auth.uid()"
              />
            )}
          </form.AppField>
        </InspectorSection>
      </InspectorSections>
      <InspectorFooter
        canSave={changed}
        warning={item && replacing ? replaceWarning(item, draft) : undefined}
        error={mutation.error}
        form={form}
        readOnly={readOnly}
        saveLabel={item ? 'Save' : 'Create policy'}
        saving={mutation.isPending}
      />
    </>
  )
}

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
        <span data-mask className="flex items-center gap-2">
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

export const Policies = () => {
  const state = useDefinitionsState({ section: 'policies' })
  const { connectionResource, run, search, selectedSchema } = state
  const query = resourcePoliciesQueryOptions({ connectionResource })
  const { data: policies = [], isPending } = useQuery(query)
  const kindFilter = useFilter<PolicyKind>(
    'All types',
    kinds.map((kind) => ({ label: kindLabels[kind], value: kind }))
  )

  const inSchema = policies.filter((item) => item.schema === selectedSchema)

  return (
    <DefinitionsPage
      items={inSchema}
      match={(item) =>
        kindFilter.matches(item.type) &&
        matchesSearch(
          search,
          item.name,
          item.table,
          item.command,
          ...item.roles
        )
      }
      loading={isPending}
      keyOf={(item) => `${item.table}.${item.name}`}
      columns={columns}
      state={state}
      toolbar={kindFilter.control}
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
    />
  )
}

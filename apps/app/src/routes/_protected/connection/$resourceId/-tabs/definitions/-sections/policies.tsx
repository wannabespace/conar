import {
  Delete02Icon,
  PlusSignIcon,
  SecurityCheckIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { matchesSearch, sameShape, uppercaseFirst } from '@tamery/shared/utils'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { CodeInline } from '@tamery/ui/components/custom/code-block'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { FieldDescription } from '@tamery/ui/components/field'
import { Switch } from '@tamery/ui/components/switch'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { toast } from 'sonner'

import { capabilitiesOf } from '~/entities/connection/capabilities'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions/list'
import { alterPolicyQuery } from '~/entities/connection/queries/policies/alter'
import { alterSecurityPolicyQuery } from '~/entities/connection/queries/policies/alter-security-policy'
import { createPolicyQuery } from '~/entities/connection/queries/policies/create'
import { createSecurityPolicyQuery } from '~/entities/connection/queries/policies/create-security-policy'
import { dropPolicyQuery } from '~/entities/connection/queries/policies/drop'
import type { policyType } from '~/entities/connection/queries/policies/list'
import { resourcePoliciesQueryOptions } from '~/entities/connection/queries/policies/list'
import { recreatePolicyQuery } from '~/entities/connection/queries/policies/recreate'
import { renamePolicyQuery } from '~/entities/connection/queries/policies/rename'
import { setRowLevelSecurityQuery } from '~/entities/connection/queries/policies/set-row-level-security'
import { setSecurityPolicyEnabledQuery } from '~/entities/connection/queries/policies/set-security-policy-enabled'
import type {
  BlockOperation,
  PolicyCommand,
  PolicyKind,
  SecurityPredicate,
} from '~/entities/connection/queries/policies/shape'
import {
  BLOCK_OPERATIONS,
  POLICY_COMMANDS,
  securityPredicate,
} from '~/entities/connection/queries/policies/shape'
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
  Inspector,
  InspectorOption,
  InspectorSection,
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

const draftOf = (
  item: PolicyItem | null,
  pageSchema: string,
  connectionType: ConnectionType
): PolicyDraft => ({
  check: item?.check ?? '',
  command: item
    ? asCommand(item.command)
    : (capabilitiesOf(connectionType).policies.commands[0] ?? 'ALL'),
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
    kind: draft.kind === item.type ? null : draft.kind,
    name: draft.name.trim() === item.name ? null : draft.name.trim(),
    roles: roles.join(',') === item.roles.join(',') ? null : roles,
    using: using === (item.using ?? '') ? null : using,
  }
}

// ALTER POLICY has no form that removes an expression the policy already has.
const clearsExpression = (item: PolicyItem, draft: PolicyDraft) =>
  (item.using !== null && draft.using.trim() === '') ||
  (item.check !== null && draft.check.trim() === '')

const replaces = (
  item: PolicyItem,
  draft: PolicyDraft,
  connectionType: ConnectionType
) =>
  !capabilitiesOf(connectionType).policies.alterInPlace &&
  (draft.command !== asCommand(item.command) ||
    draft.kind !== item.type ||
    clearsExpression(item, draft))

const policySchema = type({
  name: type(/\S/u).configure({ message: 'Give the policy a name.' }),
  table: type(/\S/u).configure({ message: 'Pick the table to protect.' }),
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
      </span>{' '}
      in one transaction. Its comment and any grants on it do not come back.
    </>
  ),
})

const savePolicy = async ({
  connectionType,
  draft,
  item,
  run,
}: {
  connectionType: ConnectionType
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

  if (replaces(item, draft, connectionType)) {
    await run(recreatePolicyQuery({ ...target, shape }))
    return
  }

  const changes = changesOf(item, draft)

  if (
    changes.roles ||
    changes.using !== null ||
    changes.check ||
    changes.kind
  ) {
    await run(
      alterPolicyQuery({
        ...target,
        check: changes.check,
        kind: changes.kind,
        newName: changes.name,
        roles: changes.roles,
        using: changes.using,
      })
    )
    return
  }
  if (changes.name) {
    await run(renamePolicyQuery({ ...target, newName: changes.name }))
  }
}

const PolicyInspector = ({
  can,
  item,
  relationNamesOf,
  onOpenChange,
  queryKey,
  run,
  schemas,
  selectedSchema,
  type: connectionType,
}: SectionInspectorProps<PolicyItem>) => {
  const mutation = useMutation({
    mutationFn: (draft: PolicyDraft) =>
      savePolicy({ connectionType, draft, item, run }),
    onSuccess: async (_result, draft) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Policy "${draft.name.trim()}" ${item ? 'saved' : 'created'}`
      )
      onOpenChange(false)
    },
  })
  const rowLevelSecurity = useMutation({
    mutationFn: ({ enabled }: { enabled: boolean }) =>
      run(
        setRowLevelSecurityQuery({
          enabled,
          schema: item?.schema ?? '',
          table: item?.table ?? '',
        })
      ),
    onError: (error, { enabled }) =>
      toast.error(
        `Failed to ${enabled ? 'enable' : 'disable'} row level security on "${item?.table}"`,
        { description: error.message }
      ),
    onSuccess: async (_result, { enabled }) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Row level security ${enabled ? 'enabled' : 'disabled'} on "${item?.table}"`
      )
    },
  })
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? '', connectionType),
    onSubmit: ({ value }) => {
      mutation.mutate(withAllowedExpressions(value))
    },
    validators: { onChange: policySchema, onMount: policySchema },
  })
  const draft = withAllowedExpressions(
    useStore(form.store, (state) => state.values)
  )

  const readOnly = item ? !can.edit : !can.create
  const { policies: options, rowLevelSecurity: rlsTables } =
    capabilitiesOf(connectionType)
  const expressions = expressionsFor(draft.command)
  const checks = options.commands.some(
    (command) => expressionsFor(command).check
  )
  const replacing = !!item && replaces(item, draft, connectionType)
  const changed =
    !item ||
    replacing ||
    Object.values(changesOf(item, draft)).some((change) => change !== null)

  return (
    <Inspector
      canSave={changed}
      description={item ? `${item.schema}.${item.table}` : draft.schema}
      form={form}
      item={item}
      mutation={mutation}
      noun="policy"
      readOnly={readOnly}
      warning={item && replacing ? replaceWarning(item, draft) : undefined}
    >
      {item && rlsTables && (
        <InspectorSection title="Status">
          <InspectorOption
            htmlFor="policy-row-level-security"
            title="Row level security"
            description="Off, the table ignores every policy on it."
          >
            <Switch
              id="policy-row-level-security"
              size="sm"
              disabled={rowLevelSecurity.isPending}
              checked={item.enabled}
              onCheckedChange={(enabled) =>
                rowLevelSecurity.mutate({ enabled })
              }
            />
          </InspectorOption>
        </InspectorSection>
      )}
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
              description={
                rlsTables
                  ? 'The policy only applies while row level security is enabled on this table.'
                  : undefined
              }
              disabled={readOnly || !!item}
              options={
                item ? [item.table] : relationNamesOf(draft.schema, 'table')
              }
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
                options={options.commands}
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
              description={`Comma-separated. Empty means ${options.everyone}.`}
              disabled={readOnly}
              placeholder={options.everyone.toLowerCase()}
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
        {checks && (
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
        )}
      </InspectorSection>
    </Inspector>
  )
}

type SavedPredicate = NonNullable<PolicyItem['predicates']>[number]

interface PredicateDraft {
  arguments: string
  // qualifiedKey of the function and of the table
  function: string
  kind: SecurityPredicate['kind']
  operation: BlockOperation | 'ALL'
  table: string
}

interface SecurityPolicyDraft {
  name: string
  predicates: PredicateDraft[]
  schema: string
}

const qualifiedKey = (schema: string, name: string) =>
  JSON.stringify([schema, name])

const qualifiedName = type('string.json.parse').to(['string', 'string'])

const qualifiedLabel = (key: string) => qualifiedName.assert(key).join('.')

const predicateKinds = ['FILTER', 'BLOCK'] as const
const blockOperations = ['ALL', ...BLOCK_OPERATIONS] as const

const operationLabel = (operation: BlockOperation | 'ALL') =>
  operation === 'ALL' ? 'Every write' : uppercaseFirst(operation.toLowerCase())

const newPredicate: PredicateDraft = {
  arguments: '',
  function: '',
  kind: 'FILTER',
  operation: 'ALL',
  table: '',
}

const predicateDraftOf = (predicate: SavedPredicate): PredicateDraft => {
  const call = securityPredicate.parse(predicate.definition)

  return {
    arguments: call?.arguments ?? '',
    function: call ? qualifiedKey(call.functionSchema, call.functionName) : '',
    kind: predicate.kind,
    operation: predicate.operation ?? 'ALL',
    table: qualifiedKey(predicate.schema, predicate.table),
  }
}

const securityDraftOf = (
  item: PolicyItem | null,
  pageSchema: string
): SecurityPolicyDraft => ({
  name: item?.name ?? '',
  predicates: item?.predicates?.map(predicateDraftOf) ?? [newPredicate],
  schema: item?.schema ?? pageSchema,
})

const predicateOf = (draft: PredicateDraft): SecurityPredicate => {
  const [functionSchema, functionName] = qualifiedName.assert(draft.function)
  const [schema, table] = qualifiedName.assert(draft.table)

  return {
    arguments: draft.arguments.trim(),
    functionName,
    functionSchema,
    kind: draft.kind,
    operation:
      draft.kind === 'BLOCK' && draft.operation !== 'ALL'
        ? draft.operation
        : null,
    schema,
    table,
  }
}

const securityPlanOf = (item: PolicyItem, draft: SecurityPolicyDraft) => {
  const before = securityDraftOf(item, item.schema).predicates.map(predicateOf)
  const after = draft.predicates.map(predicateOf)
  const name = draft.name.trim()

  return {
    added: after.filter((next) => !before.some((old) => sameShape(old, next))),
    dropped: before.filter(
      (old) => !after.some((next) => sameShape(old, next))
    ),
    newName: name === item.name ? null : name,
  }
}

const securityPolicySchema = type({
  name: type(/\S/u).configure({ message: 'Give the policy a name.' }),
  predicates: type({
    function: type(/\S/u).configure({
      message: 'Pick the predicate function.',
    }),
    table: type(/\S/u).configure({ message: 'Pick the table to protect.' }),
  }).array(),
})

const SecurityPolicyInspector = ({
  can,
  connectionResource,
  item,
  relationNamesOf,
  onOpenChange,
  queryKey,
  run,
  schemas,
  selectedSchema,
}: SectionInspectorProps<PolicyItem>) => {
  const { data: functions = [], isPending: functionsPending } = useQuery(
    resourceFunctionsQueryOptions({ connectionResource })
  )
  const mutation = useMutation({
    mutationFn: (draft: SecurityPolicyDraft) =>
      run(
        item
          ? alterSecurityPolicyQuery({
              ...securityPlanOf(item, draft),
              name: item.name,
              schema: item.schema,
            })
          : createSecurityPolicyQuery({
              name: draft.name.trim(),
              predicates: draft.predicates.map(predicateOf),
              schema: draft.schema,
            })
      ),
    onSuccess: async (_result, draft) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Security policy "${draft.name.trim()}" ${item ? 'saved' : 'created'}`
      )
      onOpenChange(false)
    },
  })
  const state = useMutation({
    mutationFn: ({ enabled }: { enabled: boolean }) =>
      run(
        setSecurityPolicyEnabledQuery({
          enabled,
          name: item?.name ?? '',
          schema: item?.schema ?? '',
        })
      ),
    onError: (error, { enabled }) =>
      toast.error(
        `Failed to ${enabled ? 'enable' : 'disable'} security policy "${item?.name}"`,
        { description: error.message }
      ),
    onSuccess: async (_result, { enabled }) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Security policy "${item?.name}" ${enabled ? 'enabled' : 'disabled'}`
      )
    },
  })
  const form = useAppForm({
    defaultValues: securityDraftOf(item, selectedSchema ?? ''),
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    validators: {
      onChange: securityPolicySchema,
      onMount: securityPolicySchema,
    },
  })
  const draft = useStore(form.store, (store) => store.values)

  // A predicate whose definition is not a plain function call has no fields to show.
  const readable = !!item?.predicates?.every(
    (predicate) => securityPredicate.parse(predicate.definition) !== null
  )
  const readOnly = item ? !can.edit || !readable : !can.create
  const tables = schemas.flatMap((schema) =>
    relationNamesOf(schema, 'table').map((table) => qualifiedKey(schema, table))
  )
  const predicateFunctions = functions
    .filter((fn) => fn.return_type === 'table')
    .map((fn) => qualifiedKey(fn.schema, fn.name))
  const complete = draft.predicates.every(
    (predicate) => predicate.function && predicate.table
  )
  const plan = item && readable && complete ? securityPlanOf(item, draft) : null
  const changed =
    !item ||
    !plan ||
    plan.added.length > 0 ||
    plan.dropped.length > 0 ||
    plan.newName !== null

  return (
    <Inspector
      canSave={changed}
      description={item ? item.schema : draft.schema}
      form={form}
      item={item}
      mutation={mutation}
      noun="security policy"
      readOnly={readOnly}
    >
      {item && (
        <InspectorSection title="Status">
          <InspectorOption
            htmlFor="security-policy-enabled"
            title="Enabled"
            description="A disabled policy keeps its predicates but filters and blocks nothing."
          >
            <Switch
              id="security-policy-enabled"
              size="sm"
              disabled={state.isPending}
              checked={item.enabled}
              onCheckedChange={(enabled) => state.mutate({ enabled })}
            />
          </InspectorOption>
        </InspectorSection>
      )}
      <InspectorSection
        title="General"
        description="A security policy binds predicate functions to tables, and SQL Server calls them for every row."
      >
        <form.AppField name="schema">
          {() => (
            <SchemaField disabled={readOnly || !!item} schemas={schemas} />
          )}
        </form.AppField>
        <form.AppField name="name">
          {() => <TextField label="Name" autoFocus disabled={readOnly} />}
        </form.AppField>
      </InspectorSection>
      {draft.predicates.map((predicate, index) => (
        <InspectorSection
          key={index}
          title={`Predicate ${index + 1}`}
          description={
            predicate.kind === 'FILTER'
              ? 'Hides the rows the function returns nothing for.'
              : 'Refuses writes that leave a row the function returns nothing for.'
          }
          action={
            !readOnly &&
            draft.predicates.length > 1 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground -mt-0.5"
                      aria-label="Remove predicate"
                      onClick={() => form.removeFieldValue('predicates', index)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    </Button>
                  }
                />
                <TooltipContent side="left">Remove predicate</TooltipContent>
              </Tooltip>
            )
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <form.AppField name={`predicates[${index}].kind`}>
              {() => (
                <SelectField
                  label="Type"
                  disabled={readOnly}
                  labelOf={(kind) => uppercaseFirst(kind.toLowerCase())}
                  options={predicateKinds}
                  placeholder="Type"
                />
              )}
            </form.AppField>
            {predicate.kind === 'BLOCK' && (
              <form.AppField name={`predicates[${index}].operation`}>
                {() => (
                  <SelectField
                    label="Operation"
                    disabled={readOnly}
                    labelOf={operationLabel}
                    options={blockOperations}
                    placeholder="Operation"
                  />
                )}
              </form.AppField>
            )}
          </div>
          <form.AppField name={`predicates[${index}].table`}>
            {() => (
              <SelectField
                label="Table"
                disabled={readOnly}
                empty="This database has no tables."
                labelOf={qualifiedLabel}
                options={tables}
                placeholder="Choose a table"
              />
            )}
          </form.AppField>
          <form.AppField name={`predicates[${index}].function`}>
            {() => (
              <SelectField
                label="Function"
                description="An inline table-valued function, created schema bound."
                disabled={readOnly}
                empty={
                  functionsPending
                    ? 'Loading…'
                    : 'No function here returns a table.'
                }
                labelOf={qualifiedLabel}
                options={predicateFunctions}
                placeholder="Choose a function"
              />
            )}
          </form.AppField>
          <form.AppField name={`predicates[${index}].arguments`}>
            {() => (
              <TextField
                label="Arguments"
                description="Columns of the table, in the order the function takes them."
                disabled={readOnly}
                placeholder="TenantId"
              />
            )}
          </form.AppField>
        </InspectorSection>
      ))}
      {!readOnly && (
        <div className="p-4">
          <Button
            variant="outline"
            onClick={() => form.pushFieldValue('predicates', newPredicate)}
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            Add predicate
          </Button>
        </div>
      )}
    </Inspector>
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

const policyKey = (item: PolicyItem) => JSON.stringify([item.table, item.name])

const securityColumns: DefinitionsColumn<PolicyItem>[] = [
  {
    cell: (item, { search }) => (
      <span className="flex flex-col gap-1">
        <span data-mask className="flex items-center gap-2">
          <HugeiconsIcon
            icon={SecurityCheckIcon}
            strokeWidth={2}
            className="text-muted-foreground size-4 shrink-0"
          />
          <HighlightText text={item.name} match={search} />
          {!item.enabled && <Badge variant="destructive">Disabled</Badge>}
        </span>
        {item.predicates?.map((predicate) => (
          <Expression
            key={JSON.stringify([
              predicate.kind,
              predicate.operation,
              predicate.schema,
              predicate.table,
            ])}
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
      functions.some((fn) => fn.return_type === 'table')
      ? undefined
      : 'A security policy calls an inline table-valued function, and none exists yet.'
  })()

  return (
    <DefinitionsPage
      columns={predicates ? securityColumns : columns}
      createBlocked={createBlocked}
      dropItem={dropItem}
      Inspector={predicates ? SecurityPolicyInspector : PolicyInspector}
      items={inSchema}
      keyOf={policyKey}
      loading={isPending}
      match={matches}
      queryKey={query.queryKey}
      state={state}
      toolbar={predicates ? undefined : kindFilter.control}
    />
  )
}

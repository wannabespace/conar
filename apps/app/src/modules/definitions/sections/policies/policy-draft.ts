import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { alterPolicyQuery } from '~/core/queries/policies/alter'
import { createPolicyQuery } from '~/core/queries/policies/create'
import type { policyType } from '~/core/queries/policies/list'
import { recreatePolicyQuery } from '~/core/queries/policies/recreate'
import { renamePolicyQuery } from '~/core/queries/policies/rename'
import type { PolicyCommand, PolicyKind } from '~/core/queries/policies/shape'
import { POLICY_COMMANDS } from '~/core/queries/policies/shape'

import type { RunQuery } from '../../hooks/use-definitions-state'

export type PolicyItem = typeof policyType.infer

export interface PolicyDraft {
  check: string
  command: PolicyCommand
  kind: PolicyKind
  name: string
  roles: string
  schema: string
  table: string
  using: string
}

export const kindLabels: Record<PolicyKind, string> = {
  PERMISSIVE: 'Permissive',
  RESTRICTIVE: 'Restrictive',
}

export const kinds = Object.keys(kindLabels) as PolicyKind[]

const parseRoles = (value: string) =>
  value
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean)

const asCommand = (value: string | undefined): PolicyCommand =>
  POLICY_COMMANDS.find((command) => command === value) ?? 'ALL'

// PostgreSQL takes USING for rows that exist and WITH CHECK for rows a write
// would produce, so INSERT has no USING and SELECT and DELETE no WITH CHECK.
export const expressionsFor = (command: PolicyCommand) => ({
  check: command !== 'SELECT' && command !== 'DELETE',
  using: command !== 'INSERT',
})

export const withAllowedExpressions = (draft: PolicyDraft): PolicyDraft => {
  const allowed = expressionsFor(draft.command)

  return {
    ...draft,
    check: allowed.check ? draft.check : '',
    using: allowed.using ? draft.using : '',
  }
}

export const draftOf = (
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

export const changesOf = (item: PolicyItem, draft: PolicyDraft) => {
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
export const clearsExpression = (item: PolicyItem, draft: PolicyDraft) =>
  (item.using !== null && draft.using.trim() === '') ||
  (item.check !== null && draft.check.trim() === '')

export const replaces = (
  item: PolicyItem,
  draft: PolicyDraft,
  connectionType: ConnectionType
) =>
  !capabilitiesOf(connectionType).policies.alterInPlace &&
  (draft.command !== asCommand(item.command) ||
    draft.kind !== item.type ||
    clearsExpression(item, draft))

export const policySchema = type({
  name: type(/\S/u).configure({ message: 'Give the policy a name.' }),
  table: type(/\S/u).configure({ message: 'Pick the table to protect.' }),
})

export const savePolicy = async ({
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
    predicates: [],
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

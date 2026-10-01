import { sameShape, uppercaseFirst } from '@tamery/shared/utils'
import { type } from 'arktype'

import type {
  BlockOperation,
  PolicyPredicate,
} from '~/core/queries/policies/shape'
import {
  BLOCK_OPERATIONS,
  policyPredicate,
} from '~/core/queries/policies/shape'

import type { PolicyItem } from './policy-draft'

type SavedPredicate = NonNullable<PolicyItem['predicates']>[number]

interface PredicateDraft {
  arguments: string
  functionKey: string
  kind: PolicyPredicate['kind']
  operation: BlockOperation | 'ALL'
  tableKey: string
}

export interface PredicatePolicyDraft {
  name: string
  predicates: PredicateDraft[]
  schema: string
}

export const qualifiedKey = (schema: string, name: string) =>
  JSON.stringify([schema, name])

const qualifiedName = type('string.json.parse').to(['string', 'string'])

export const qualifiedLabel = (key: string) =>
  qualifiedName.assert(key).join('.')

export const predicateKinds = ['FILTER', 'BLOCK'] as const
export const blockOperations = ['ALL', ...BLOCK_OPERATIONS] as const

export const operationLabel = (operation: BlockOperation | 'ALL') =>
  operation === 'ALL' ? 'Every write' : uppercaseFirst(operation.toLowerCase())

export const newPredicate: PredicateDraft = {
  arguments: '',
  functionKey: '',
  kind: 'FILTER',
  operation: 'ALL',
  tableKey: '',
}

const predicateDraftOf = (predicate: SavedPredicate): PredicateDraft => {
  const call = policyPredicate.parse(predicate.definition)

  return {
    arguments: call?.arguments ?? '',
    functionKey: call
      ? qualifiedKey(call.functionSchema, call.functionName)
      : '',
    kind: predicate.kind,
    operation: predicate.operation ?? 'ALL',
    tableKey: qualifiedKey(predicate.schema, predicate.table),
  }
}

export const predicatePolicyDraftOf = (
  item: PolicyItem | null,
  pageSchema: string
): PredicatePolicyDraft => ({
  name: item?.name ?? '',
  predicates: item?.predicates?.map(predicateDraftOf) ?? [newPredicate],
  schema: item?.schema ?? pageSchema,
})

export const predicateOf = (draft: PredicateDraft): PolicyPredicate => {
  const [functionSchema, functionName] = qualifiedName.assert(draft.functionKey)
  const [schema, table] = qualifiedName.assert(draft.tableKey)

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

export const predicatePlanOf = (
  item: PolicyItem,
  draft: PredicatePolicyDraft
) => {
  const before = predicatePolicyDraftOf(item, item.schema).predicates.map(
    predicateOf
  )
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

export const predicatePolicySchema = type({
  name: type(/\S/u).configure({ message: 'Give the policy a name.' }),
  predicates: type({
    functionKey: type(/\S/u).configure({
      message: 'Pick the predicate function.',
    }),
    tableKey: type(/\S/u).configure({
      message: 'Pick the table to protect.',
    }),
  }).array(),
})

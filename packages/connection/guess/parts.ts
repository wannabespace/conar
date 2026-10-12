import { pick } from '@tamery/shared/utils'

import type { GuessedParts } from './types'

const FIELDS = [
  'database',
  'host',
  'options',
  'password',
  'port',
  'ssh',
  'type',
  'user',
] as const

/** Earlier parts win field by field; empty values are dropped. */
export const mergeParts = (...list: GuessedParts[]): GuessedParts => {
  const merged: GuessedParts = {}
  for (const parts of list.toReversed()) {
    const filled = FIELDS.filter((field) => parts[field])
    Object.assign(merged, pick(parts, filled))
  }
  return merged
}

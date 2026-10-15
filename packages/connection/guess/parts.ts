import type { GuessedParts } from './types'

/** Earlier parts win field by field; empty values are dropped. */
export const mergeParts = (...list: GuessedParts[]): GuessedParts =>
  Object.fromEntries(
    list
      .toReversed()
      .flatMap((parts) => Object.entries(parts))
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
  )

import type { GuessedParts } from './types'

export const mergeParts = (...list: GuessedParts[]): GuessedParts =>
  Object.fromEntries(
    list
      .toReversed()
      .flatMap((parts) => Object.entries(parts))
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
  )

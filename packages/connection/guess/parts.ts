import type { GuessedParts } from './types'

/** Earlier parts win field by field; empty values are dropped. */
export const mergeParts = (...list: GuessedParts[]): GuessedParts =>
  Object.assign(
    {},
    ...list
      .toReversed()
      .map((parts) =>
        Object.fromEntries(
          Object.entries(parts).filter(
            ([, value]) => value !== undefined && value !== null && value !== ''
          )
        )
      )
  )

/** The first non-empty value among `keys`, in order. */
export const firstValueOf = (
  keys: string[],
  valueOf: (key: string) => string | null | undefined
) => keys.map(valueOf).find(Boolean) ?? ''

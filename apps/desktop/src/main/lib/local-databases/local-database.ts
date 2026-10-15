import type { GuessedParts } from '@tamery/connection/guess/types'
import type { Engine } from '@tamery/shared/enums/connection-type'
import type { MaybePromise } from '@tamery/shared/utils'
import type { ArkErrors } from 'arktype'
import { type } from 'arktype'
import { Result } from 'better-result'

export interface Unlocked {
  password: string
  withheld: boolean
}

export const NOTHING_UNLOCKED: Unlocked = { password: '', withheld: false }

export interface LocalDatabase {
  connectionString: string
  engine: Engine
  name: string
  source: string
  unlock: () => Promise<Unlocked>
}

export interface FoundEntry {
  name: string
  parts: GuessedParts
  unlock?: () => Promise<Unlocked>
}

export interface Finder {
  read: (target: string) => MaybePromise<FoundEntry[]>
  source: string
  targets: () => MaybePromise<readonly string[]>
}

export const findEach = async <T, R>(
  items: readonly T[],
  find: (item: T) => MaybePromise<R[]>
) => {
  const found = await Promise.all(
    items.map((item) => Result.tryPromise(() => Promise.try(find, item)))
  )
  return found.flatMap((result) => result.unwrapOr([]))
}

export const validEntries = <T>(
  schema: (entry: unknown) => T | ArkErrors,
  entries: unknown[]
) =>
  entries.flatMap((entry) => {
    const valid = schema(entry)
    return valid instanceof type.errors ? [] : [valid]
  })

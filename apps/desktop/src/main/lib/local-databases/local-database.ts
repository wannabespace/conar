import type { GuessedParts } from '@tamery/connection/guess/types'
import type { Engine } from '@tamery/shared/enums/connection-type'
import type { MaybePromise } from '@tamery/shared/utils'
import { tryCatchAsync } from '@tamery/shared/utils'
import type { ArkErrors } from 'arktype'
import { type } from 'arktype'

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
  /** Config files, or Docker's sockets: each is read on its own. */
  files: readonly string[] | (() => Promise<string[]>)
  read: (file: string) => MaybePromise<FoundEntry[]>
  source: string
}

/** One missing or unreadable item finds nothing; it never hides the rest. */
export const findEach = async <T, R>(
  items: readonly T[],
  find: (item: T) => MaybePromise<R[]>
) => {
  const found = await Promise.all(
    items.map((item) => tryCatchAsync(() => Promise.try(find, item)))
  )
  return found.flatMap(({ data }) => data ?? [])
}

/** One odd entry must not hide the rest of its source. */
export const validEntries = <T>(
  schema: (entry: unknown) => T | ArkErrors,
  entries: unknown[]
) =>
  entries.flatMap((entry) => {
    const valid = schema(entry)
    return valid instanceof type.errors ? [] : [valid]
  })

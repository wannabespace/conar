import type { ConnectionParts } from '@tamery/connection/connection-parts'
import { connectionParts } from '@tamery/connection/connection-parts'
import type { GuessedParts } from '@tamery/connection/guess/types'
import type { Engine } from '@tamery/shared/enums/connection-type'
import { engines } from '@tamery/shared/enums/connection-type'
import type { MaybePromise } from '@tamery/shared/utils'
import { tryCatchAsync } from '@tamery/shared/utils'
import type { ArkErrors } from 'arktype'
import { type } from 'arktype'

export interface Unlocked {
  password: string
  withheld: boolean
}

export interface LocalDatabase {
  connectionString: string
  engine: Engine
  name: string
  /** Where it was found, shown to the user: `Docker`, `DBeaver`, `.pgpass`. */
  source: string
  unlock: () => Promise<Unlocked>
}

const NO_PARTS: ConnectionParts = {
  database: '',
  host: '',
  https: null,
  options: '',
  password: '',
  port: '',
  ssh: null,
  type: null,
  user: '',
}

const NOTHING_SAVED = () =>
  Promise.resolve<Unlocked>({ password: '', withheld: false })

/** The connection string never carries the password: only `unlock` hands it out. */
export const localDatabase = (
  source: string,
  name: string,
  { flavor, password, ...parts }: GuessedParts,
  unlock = NOTHING_SAVED
): LocalDatabase[] => {
  const connectionString = connectionParts.format({
    ...NO_PARTS,
    ...Object.fromEntries(
      Object.entries(parts).filter(([, value]) => value !== undefined)
    ),
  })
  return connectionString && parts.type
    ? [
        {
          connectionString,
          engine: engines.of({ flavor, type: parts.type }),
          name: name || parts.database || parts.host || '',
          source,
          unlock: password
            ? () => Promise.resolve({ password, withheld: false })
            : unlock,
        },
      ]
    : []
}

/** One missing or unreadable item finds nothing; it never hides the rest. */
export const findEach = async <T>(
  items: readonly T[],
  find: (item: T) => MaybePromise<LocalDatabase[]>
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

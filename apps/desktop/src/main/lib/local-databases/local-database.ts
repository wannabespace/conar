import type { ConnectionParts } from '@tamery/connection/connection-parts'
import { connectionParts } from '@tamery/connection/connection-parts'
import type { GuessedParts } from '@tamery/connection/guess/types'
import type { ConnectionFlavor } from '@tamery/shared/enums/connection-type'
import type { ArkErrors } from 'arktype'
import { type } from 'arktype'

export interface Unlocked {
  password: string
  withheld: boolean
}

export interface LocalDatabase {
  connectionString: string
  flavor: ConnectionFlavor | null
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

/** The connection string never carries the password: only `unlock` hands it out. An empty string (no host or engine) is dropped by `find`. */
export const localDatabase = (
  source: string,
  name: string,
  { flavor = null, password, ...parts }: GuessedParts,
  unlock = NOTHING_SAVED
): LocalDatabase => ({
  connectionString: connectionParts.format({
    ...NO_PARTS,
    ...Object.fromEntries(
      Object.entries(parts).filter(([, value]) => value !== undefined)
    ),
  }),
  flavor,
  name: name || parts.database || parts.host || '',
  source,
  unlock: password
    ? () => Promise.resolve({ password, withheld: false })
    : unlock,
})

/** One odd entry must not hide the rest of its source. */
export const validEntries = <T>(
  schema: (entry: unknown) => T | ArkErrors,
  entries: unknown[]
) =>
  entries.flatMap((entry) => {
    const valid = schema(entry)
    return valid instanceof type.errors ? [] : [valid]
  })

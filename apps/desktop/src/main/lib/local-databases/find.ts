import { omit, tryCatchAsync } from '@tamery/shared/utils'

import { dataGripDatabases } from './datagrip'
import { dbeaverDatabases } from './dbeaver'
import { dockerDatabases } from './docker'
import { pgpassDatabases, pgServiceDatabases } from './libpq'
import type { LocalDatabase, Unlocked } from './local-database'
import { myCnfDatabases } from './my-cnf'
import { pgAdminDatabases } from './pgadmin'
import { tablePlusDatabases } from './tableplus'

const SOURCES = [
  dockerDatabases,
  dbeaverDatabases,
  tablePlusDatabases,
  dataGripDatabases,
  pgAdminDatabases,
  pgServiceDatabases,
  pgpassDatabases,
  myCnfDatabases,
]

// Keyed by what `find` returned, so the renderer can only unlock a password a found database points at, never name an arbitrary Keychain item.
let unlockOf = new Map<string, LocalDatabase['unlock']>()

export const localDatabases = {
  /** A missing or unreadable source finds nothing; it never fails the rest. */
  find: async () => {
    const sources = await Promise.all(
      SOURCES.map((source) => tryCatchAsync(() => Promise.try(source)))
    )
    const found = sources
      .flatMap(({ data }) => data ?? [])
      .filter(({ connectionString }) => connectionString)
    const unique = found.filter(
      ({ connectionString }, index) =>
        found.findIndex(
          (other) => other.connectionString === connectionString
        ) === index
    )
    unlockOf = new Map(
      unique.map(({ connectionString, unlock }) => [connectionString, unlock])
    )
    return unique.map((database) => omit(database, ['unlock']))
  },
  unlock: async (connectionString: string): Promise<Unlocked> =>
    (await unlockOf.get(connectionString)?.()) ?? {
      password: '',
      withheld: false,
    },
}

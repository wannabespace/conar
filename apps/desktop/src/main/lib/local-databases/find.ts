import { omit } from '@tamery/shared/utils'

import { dataGripDatabases } from './datagrip'
import { dbeaverDatabases } from './dbeaver'
import { dockerDatabases } from './docker'
import { pgpassDatabases, pgServiceDatabases } from './libpq'
import type { LocalDatabase, Unlocked } from './local-database'
import { findEach } from './local-database'
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
let found = new Map<string, LocalDatabase>()

export const localDatabases = {
  /** The first source to find a database names it; a later one's password still unlocks it. */
  find: async () => {
    const unique = new Map<string, LocalDatabase>()
    for (const database of await findEach(SOURCES, (source) => source())) {
      const first = unique.get(database.connectionString)
      unique.set(
        database.connectionString,
        first
          ? {
              ...first,
              unlock: async () => {
                const unlocked = await first.unlock()
                if (unlocked.password) {
                  return unlocked
                }
                const next = await database.unlock()
                return next.password ? next : unlocked
              },
            }
          : database
      )
    }
    found = unique
    return [...unique.values()].map((database) => omit(database, ['unlock']))
  },
  unlock: async (connectionString: string): Promise<Unlocked> =>
    (await found.get(connectionString)?.unlock()) ?? {
      password: '',
      withheld: false,
    },
}

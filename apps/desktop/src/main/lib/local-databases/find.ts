import { connectionParts } from '@tamery/connection/connection-parts'
import { mergeParts } from '@tamery/connection/guess/parts'
import { engines } from '@tamery/shared/enums/connection-type'
import { omit } from '@tamery/shared/utils'

import { dataGrip } from './datagrip'
import { dbeaver } from './dbeaver'
import { docker } from './docker'
import { pgpass, pgService } from './libpq'
import type {
  Finder,
  FoundEntry,
  LocalDatabase,
  Unlocked,
} from './local-database'
import { findEach, NOTHING_UNLOCKED } from './local-database'
import { myCnf } from './my-cnf'
import { pgAdmin } from './pgadmin'
import { tablePlus } from './tableplus'

const FINDERS: Finder[] = [
  docker,
  dbeaver,
  tablePlus,
  dataGrip,
  pgAdmin,
  pgService,
  pgpass,
  myCnf,
]

const NO_PARTS = {
  database: '',
  host: '',
  https: null,
  options: '',
  password: '',
  port: '',
  ssh: null,
  user: '',
}

/** The connection string never carries the password: only `unlock` hands it out. */
const localDatabase = (
  source: string,
  { name, parts, unlock = () => Promise.resolve(NOTHING_UNLOCKED) }: FoundEntry
): LocalDatabase[] => {
  const { engine, password, ...server } = { ...NO_PARTS, ...mergeParts(parts) }
  return engine && server.host
    ? [
        {
          connectionString: connectionParts.format({
            ...server,
            password: '',
            type: engines.type(engine),
          }),
          engine,
          name: name || server.database || server.host,
          source,
          unlock: password
            ? () => Promise.resolve({ password, withheld: false })
            : unlock,
        },
      ]
    : []
}

const databasesOf = async ({ files, read, source }: Finder) =>
  findEach(
    typeof files === 'function' ? await files() : files,
    async (file) => {
      const entries = await read(file)
      return entries.flatMap((entry) => localDatabase(source, entry))
    }
  )

// Keyed by what `find` returned, so the renderer can only unlock a password a found database points at, never name an arbitrary Keychain item.
let found = new Map<string, LocalDatabase>()

export const localDatabases = {
  /** The first source to find a database names it; a later one's password still unlocks it. */
  find: async () => {
    const unique = new Map<string, LocalDatabase>()
    for (const database of await findEach(FINDERS, databasesOf)) {
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
    (await found.get(connectionString)?.unlock()) ?? NOTHING_UNLOCKED,
}

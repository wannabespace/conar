import { tryCatchAsync } from '@tamery/shared/utils'

import { dataGripDatabases } from './datagrip'
import { dbeaverDatabases } from './dbeaver'
import { dockerDatabases } from './docker'
import { pgpassDatabases, pgServiceDatabases } from './libpq'
import type { LocalDatabase } from './local-database'
import { myCnfDatabases } from './my-cnf'
import { pgAdminDatabases } from './pgadmin'
import { tablePlusDatabases } from './tableplus'

const SOURCES: (() => LocalDatabase[] | Promise<LocalDatabase[]>)[] = [
  dockerDatabases,
  dbeaverDatabases,
  tablePlusDatabases,
  dataGripDatabases,
  pgAdminDatabases,
  pgServiceDatabases,
  pgpassDatabases,
  myCnfDatabases,
]

/** A missing or unreadable source finds nothing; it never fails the rest. */
export const findLocalDatabases = async () => {
  const sources = await Promise.all(
    SOURCES.map((source) => tryCatchAsync(() => Promise.try(source)))
  )
  const found = sources
    .flatMap(({ data }) => data ?? [])
    .filter(({ connectionString }) => connectionString)
  return found.filter(
    ({ connectionString }, index) =>
      found.findIndex(
        (other) => other.connectionString === connectionString
      ) === index
  )
}

import type { ConnectionParts } from '@tamery/connection/connection-parts'
import { connectionParts } from '@tamery/connection/connection-parts'
import { mergeParts } from '@tamery/connection/guess/parts'

export interface LocalDatabase {
  connectionString: string
  name: string
  /** Where it was found, shown to the user: `Docker`, `DBeaver`, `.pgpass`. */
  source: string
}

const NO_PARTS: ConnectionParts = {
  database: '',
  flavor: null,
  host: '',
  https: null,
  options: '',
  password: '',
  port: '',
  ssh: null,
  type: null,
  user: '',
}

/** An empty connection string (no host or engine) is dropped by `findLocalDatabases`. */
export const localDatabase = (
  source: string,
  name: string,
  parts: Partial<ConnectionParts>
): LocalDatabase => ({
  connectionString: connectionParts.format({
    ...NO_PARTS,
    ...mergeParts(parts),
  }),
  name: name || parts.database || parts.host || '',
  source,
})

import type { SqliteLocation } from '@tamery/shared/enums/connection-type'
import {
  ConnectionType,
  connectionTypeLabels,
  sqliteLocationLabels,
} from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'

import { Reveal } from '~/components/reveal'

const REMOTE_SQLITE: SqliteLocation[] = ['libsql', 'd1']

const ENGINES = [
  ...Object.values(ConnectionType).map((type) => ({
    label: connectionTypeLabels[type],
    sqliteLocation: 'file' as const,
    type,
  })),
  ...REMOTE_SQLITE.map((sqliteLocation) => ({
    label: sqliteLocationLabels[sqliteLocation],
    sqliteLocation,
    type: ConnectionType.SQLite,
  })),
]

export const Engines = () => (
  <section
    aria-label="Supported databases"
    className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6"
  >
    <Reveal className="text-muted-foreground flex flex-wrap justify-center gap-x-12 gap-y-6 sm:grid sm:grid-cols-4 sm:justify-items-center">
      {ENGINES.map(({ label, sqliteLocation, type }) => (
        <span
          key={label}
          className="flex items-center justify-center gap-2.5 text-base font-medium"
        >
          <ConnectionIcon
            type={type}
            sqliteLocation={sqliteLocation}
            className="size-6"
          />
          {label}
        </span>
      ))}
    </Reveal>
  </section>
)

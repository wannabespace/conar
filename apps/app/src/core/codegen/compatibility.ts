import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { GeneratorFormat } from './utils'

export const GENERATOR_COMPATIBILITY: Partial<
  Record<GeneratorFormat, ConnectionType[]>
> = {
  drizzle: [
    ConnectionType.Postgres,
    ConnectionType.MySQL,
    ConnectionType.MSSQL,
  ],
  prisma: [ConnectionType.Postgres, ConnectionType.MySQL, ConnectionType.MSSQL],
}

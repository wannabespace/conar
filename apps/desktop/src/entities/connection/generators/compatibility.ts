import type { GeneratorFormat } from './utils'
import { ConnectionType } from '@conar/shared/enums/connection-type'

export const GENERATOR_COMPATIBILITY: Partial<Record<GeneratorFormat, ConnectionType[]>> = {
  prisma: [ConnectionType.Postgres, ConnectionType.MySQL, ConnectionType.MSSQL],
  drizzle: [ConnectionType.Postgres, ConnectionType.MySQL, ConnectionType.MSSQL, ConnectionType.ClickHouse, ConnectionType.SQLite],
  kysely: [ConnectionType.Postgres, ConnectionType.MySQL, ConnectionType.MSSQL, ConnectionType.ClickHouse, ConnectionType.SQLite],
}

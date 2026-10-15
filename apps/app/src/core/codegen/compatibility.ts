import { SqlDialect } from '@tamery/shared/enums/connection-type'

import type { GeneratorFormat } from './types'

export const GENERATOR_COMPATIBILITY: Partial<
  Record<GeneratorFormat, SqlDialect[]>
> = {
  drizzle: [SqlDialect.Postgres, SqlDialect.MySQL, SqlDialect.MSSQL],
  prisma: [SqlDialect.Postgres, SqlDialect.MySQL, SqlDialect.MSSQL],
}

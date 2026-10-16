import { Dialect } from '@tamery/shared/enums/connection-type'

import type { GeneratorFormat } from './types'

export const GENERATOR_COMPATIBILITY: Partial<
  Record<GeneratorFormat, Dialect[]>
> = {
  drizzle: [Dialect.Postgres, Dialect.MySQL, Dialect.MSSQL],
  prisma: [Dialect.Postgres, Dialect.MySQL, Dialect.MSSQL],
}

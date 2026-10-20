import { faker } from '@faker-js/faker/locale/en'
import type { Dialect } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { inCategory } from '../base'
import type { GeneratorMap } from '../types'

export const DUCKDB_GENERATORS = inCategory('DuckDB', {
  'duckdb.blob': [
    'Blob',
    () =>
      sql`from_hex(${sql.lit(faker.string.hexadecimal({ length: 32, prefix: '' }))})`,
  ],
}) satisfies GeneratorMap<Dialect.DuckDB>

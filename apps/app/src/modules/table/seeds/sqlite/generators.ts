import { faker } from '@faker-js/faker/locale/en'
import type { Dialect } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { inCategory } from '../base'
import type { GeneratorMap } from '../types'

export const SQLITE_GENERATORS = inCategory('SQLite', {
  'sqlite.blob': [
    'Blob',
    () =>
      sql`X${sql.lit(faker.string.hexadecimal({ length: 32, prefix: '' }))}`,
  ],
}) satisfies GeneratorMap<Dialect.SQLite>

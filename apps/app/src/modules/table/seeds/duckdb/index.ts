import type { DialectSeedConfig } from '../registry'
import { SKIP_GENERATOR } from '../types'
import { DUCKDB_GENERATORS } from './generators'

export const duckdbSeedConfig = {
  generators: DUCKDB_GENERATORS,
  types: {
    blob: 'duckdb.blob',
    map: SKIP_GENERATOR,
    struct: SKIP_GENERATOR,
    union: SKIP_GENERATOR,
  },
} satisfies DialectSeedConfig

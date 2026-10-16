import type { DialectSeedConfig } from '../registry'
import { SQLITE_GENERATORS } from './generators'

export const sqliteSeedConfig = {
  generators: SQLITE_GENERATORS,
  types: { blob: 'sqlite.blob' },
} satisfies DialectSeedConfig

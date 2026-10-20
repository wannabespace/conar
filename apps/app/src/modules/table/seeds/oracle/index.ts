import type { DialectSeedConfig } from '../registry'
import { SKIP_GENERATOR } from '../types'
import { ORACLE_GENERATORS } from './generators'

export const oracleSeedConfig = {
  generators: ORACLE_GENERATORS,
  types: {
    bfile: SKIP_GENERATOR,
    blob: 'oracle.binary',
    'interval day': 'oracle.interval',
    'interval year to month': 'oracle.interval',
    'long raw': 'oracle.binary',
    raw: 'oracle.binary',
    xmltype: 'oracle.xml',
  },
} satisfies DialectSeedConfig

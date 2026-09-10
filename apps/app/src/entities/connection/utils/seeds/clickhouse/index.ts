import type { DialectSeedConfig } from '../registry'
import { SKIP_GENERATOR } from '../types'

export const clickhouseSeedConfig = {
  generators: {},
  types: {
    fixedstring: 'lorem.word',
    ipv4: 'internet.ip',
    ipv6: 'internet.ipv6',
    // ClickHouse fills omitted columns with the type's zero value, so composite types it cannot fake are left out
    map: SKIP_GENERATOR,
    nested: SKIP_GENERATOR,
    tuple: SKIP_GENERATOR,
  },
} satisfies DialectSeedConfig

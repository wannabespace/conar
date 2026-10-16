import type { DialectSeedConfig } from './registry'
import { SKIP_GENERATOR } from './types'

export const clickhouseSeedConfig = {
  generators: {},
  types: {
    fixedstring: 'lorem.word',
    ipv4: 'internet.ip',
    ipv6: 'internet.ipv6',
    map: SKIP_GENERATOR,
    nested: SKIP_GENERATOR,
    tuple: SKIP_GENERATOR,
  },
} satisfies DialectSeedConfig

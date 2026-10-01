import type { DialectSeedConfig } from '../registry'
import { MSSQL_GENERATORS } from './generators'

export const mssqlSeedConfig = {
  generators: MSSQL_GENERATORS,
  types: {
    binary: 'mssql.binary',
    bit: 'datatype.boolean',
    geography: 'mssql.geography',
    geometry: 'mssql.geometry',
    image: 'mssql.binary',
    varbinary: 'mssql.binary',
    xml: 'mssql.xml',
  },
} satisfies DialectSeedConfig

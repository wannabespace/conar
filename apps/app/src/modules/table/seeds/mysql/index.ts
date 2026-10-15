import type { DialectSeedConfig } from '../registry'
import { MYSQL_GENERATORS } from './generators'

export const mysqlSeedConfig = {
  generators: MYSQL_GENERATORS,
  transformArray: (items) => items.map(String).join(','),
  types: {
    binary: 'mysql.binary',
    bit: 'datatype.boolean',
    blob: 'mysql.binary',
    geomcollection: 'mysql.geometrycollection',
    geometry: 'mysql.point',
    geometrycollection: 'mysql.geometrycollection',
    inet4: 'internet.ip',
    inet6: 'internet.ipv6',
    linestring: 'mysql.linestring',
    longblob: 'mysql.binary',
    mediumblob: 'mysql.binary',
    multilinestring: 'mysql.multilinestring',
    multipoint: 'mysql.multipoint',
    multipolygon: 'mysql.multipolygon',
    point: 'mysql.point',
    polygon: 'mysql.polygon',
    tinyblob: 'mysql.binary',
    tinyint: 'datatype.boolean',
    varbinary: 'mysql.binary',
    year: 'mysql.year',
  },
} satisfies DialectSeedConfig

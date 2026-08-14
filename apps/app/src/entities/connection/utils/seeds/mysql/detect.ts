import type { GeneratorId } from '..'

const TYPE_TO_GENERATOR: Record<string, GeneratorId> = {
  binary: 'mysql.binary',
  bit: 'mysql.bit',
  blob: 'mysql.binary',
  date: 'mysql.date',
  datetime: 'mysql.datetime',
  geomcollection: 'mysql.geometrycollection',
  geometry: 'mysql.point',
  geometrycollection: 'mysql.geometrycollection',
  linestring: 'mysql.linestring',
  longblob: 'mysql.binary',
  mediumblob: 'mysql.binary',
  multilinestring: 'mysql.multilinestring',
  multipoint: 'mysql.multipoint',
  multipolygon: 'mysql.multipolygon',
  point: 'mysql.point',
  polygon: 'mysql.polygon',
  timestamp: 'mysql.datetime',
  tinyblob: 'mysql.binary',
  tinyint: 'datatype.boolean',
  varbinary: 'mysql.binary',
  year: 'mysql.year',
}

export const mysqlAutoDetect = (label: string): GeneratorId | undefined =>
  TYPE_TO_GENERATOR[label]

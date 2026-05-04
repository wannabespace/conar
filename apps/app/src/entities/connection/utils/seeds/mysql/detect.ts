import type { GeneratorId } from '..'

const TYPE_TO_GENERATOR: Record<string, GeneratorId> = {
  date: 'mysql.date',
  datetime: 'mysql.datetime',
  timestamp: 'mysql.datetime',
  tinyint: 'datatype.boolean',
  year: 'mysql.year',
  bit: 'mysql.bit',
  binary: 'mysql.binary',
  varbinary: 'mysql.binary',
  tinyblob: 'mysql.binary',
  blob: 'mysql.binary',
  mediumblob: 'mysql.binary',
  longblob: 'mysql.binary',
  geometry: 'mysql.point',
  point: 'mysql.point',
  linestring: 'mysql.linestring',
  polygon: 'mysql.polygon',
  multipoint: 'mysql.multipoint',
  multilinestring: 'mysql.multilinestring',
  multipolygon: 'mysql.multipolygon',
  geometrycollection: 'mysql.geometrycollection',
  geomcollection: 'mysql.geometrycollection',
}

export function mysqlAutoDetect(label: string): GeneratorId | undefined {
  return TYPE_TO_GENERATOR[label]
}

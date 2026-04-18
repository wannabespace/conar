import type { GeneratorId } from '..'

export function mysqlAutoDetect(label: string): GeneratorId | undefined {
  if (label === 'date')
    return 'mysql.date'
  if (label === 'datetime' || label === 'timestamp')
    return 'mysql.datetime'
  if (label === 'tinyint')
    return 'datatype.boolean'
  if (label === 'year')
    return 'mysql.year'
  if (label === 'bit')
    return 'mysql.bit'
  if (label === 'binary' || label === 'varbinary')
    return 'mysql.binary'
  if (label === 'tinyblob' || label === 'blob' || label === 'mediumblob' || label === 'longblob')
    return 'mysql.binary'
  if (label === 'geometry')
    return 'mysql.point'
  if (label === 'point')
    return 'mysql.point'
  if (label === 'linestring')
    return 'mysql.linestring'
  if (label === 'polygon')
    return 'mysql.polygon'
  if (label === 'multipoint')
    return 'mysql.multipoint'
  if (label === 'multilinestring')
    return 'mysql.multilinestring'
  if (label === 'multipolygon')
    return 'mysql.multipolygon'
  if (label === 'geometrycollection' || label === 'geomcollection')
    return 'mysql.geometrycollection'
}

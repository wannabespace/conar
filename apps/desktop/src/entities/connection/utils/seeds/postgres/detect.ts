import type { GeneratorId } from '..'

export function pgAutoDetect(label: string, type: string): GeneratorId | undefined {
  if (label === 'int4range' || label === 'int8range')
    return 'pg.intrange'
  if (label === 'numrange')
    return 'pg.numrange'
  if (label === 'daterange')
    return 'pg.daterange'
  if (label === 'tsrange' || label === 'tstzrange')
    return 'pg.tsrange'
  if (label === 'int4multirange' || label === 'int8multirange')
    return 'pg.intmultirange'
  if (label === 'nummultirange')
    return 'pg.nummultirange'
  if (label === 'datemultirange')
    return 'pg.datemultirange'
  if (label === 'tsmultirange' || label === 'tstzmultirange')
    return 'pg.tsmultirange'

  if (type === 'bit varying' || type === 'varbit' || type === 'bit' || label === 'varbit' || label === 'bit')
    return 'number.binary'
  if (type === 'bytea' || label === 'bytea')
    return 'string.hexadecimal'
  if (type === 'xml' || type === 'tsvector' || label === 'xml' || label === 'tsvector')
    return 'lorem.sentence'
  if (type === 'tsquery' || label === 'tsquery')
    return 'lorem.word'
  if (type === 'inet' || type === 'cidr' || label === 'inet' || label === 'cidr')
    return 'internet.ip'
  if (type === 'inet6' || label === 'inet6')
    return 'internet.ipv6'
  if (type === 'macaddr' || type === 'macaddr8' || label === 'macaddr' || label === 'macaddr8')
    return 'internet.mac'
  if (type === 'point' || label === 'point')
    return 'pg.point'
  if (type === 'line' || label === 'line')
    return 'pg.line'
  if (type === 'lseg' || label === 'lseg')
    return 'pg.lseg'
  if (type === 'box' || label === 'box')
    return 'pg.box'
  if (type === 'path' || label === 'path')
    return 'pg.path'
  if (type === 'polygon' || label === 'polygon')
    return 'pg.polygon'
  if (type === 'circle' || label === 'circle')
    return 'pg.circle'
  if (type === 'interval' || label === 'interval')
    return 'pg.interval'
  if (type === 'oid' || label === 'oid')
    return 'number.int'
}

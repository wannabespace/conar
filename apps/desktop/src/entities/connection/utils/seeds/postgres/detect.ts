import type { GeneratorId } from '..'

export function pgAutoDetect(label: string): GeneratorId | undefined {
  if (label === 'int4range' || label === 'int8range')
    return 'postgres.intrange'
  if (label === 'numrange')
    return 'postgres.numrange'
  if (label === 'daterange')
    return 'postgres.daterange'
  if (label === 'tsrange' || label === 'tstzrange')
    return 'postgres.tsrange'
  if (label === 'int4multirange' || label === 'int8multirange')
    return 'postgres.intmultirange'
  if (label === 'nummultirange')
    return 'postgres.nummultirange'
  if (label === 'datemultirange')
    return 'postgres.datemultirange'
  if (label === 'tsmultirange' || label === 'tstzmultirange')
    return 'postgres.tsmultirange'
  if (label === 'varbit' || label === 'bit')
    return 'number.binary'
  if (label === 'bytea')
    return 'string.hexadecimal'
  if (label === 'xml' || label === 'tsvector')
    return 'lorem.sentence'
  if (label === 'tsquery')
    return 'lorem.word'
  if (label === 'inet' || label === 'cidr')
    return 'internet.ip'
  if (label === 'inet6')
    return 'internet.ipv6'
  if (label === 'macaddr' || label === 'macaddr8')
    return 'internet.mac'
  if (label === 'point')
    return 'postgres.point'
  if (label === 'line')
    return 'postgres.line'
  if (label === 'lseg')
    return 'postgres.lseg'
  if (label === 'box')
    return 'postgres.box'
  if (label === 'path')
    return 'postgres.path'
  if (label === 'polygon')
    return 'postgres.polygon'
  if (label === 'circle')
    return 'postgres.circle'
  if (label === 'interval')
    return 'postgres.interval'
  if (label === 'oid')
    return 'number.int'
}

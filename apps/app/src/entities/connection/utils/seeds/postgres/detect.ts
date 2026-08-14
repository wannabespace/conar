import type { GeneratorId } from '..'

const TYPE_TO_GENERATOR: Record<string, GeneratorId> = {
  bit: 'number.binary',
  box: 'postgres.box',
  bytea: 'string.hexadecimal',
  cidr: 'internet.ip',
  circle: 'postgres.circle',
  datemultirange: 'postgres.datemultirange',
  daterange: 'postgres.daterange',
  inet: 'internet.ip',
  inet6: 'internet.ipv6',
  int4multirange: 'postgres.intmultirange',
  int4range: 'postgres.intrange',
  int8multirange: 'postgres.intmultirange',
  int8range: 'postgres.intrange',
  interval: 'postgres.interval',
  line: 'postgres.line',
  lseg: 'postgres.lseg',
  macaddr: 'internet.mac',
  macaddr8: 'internet.mac',
  nummultirange: 'postgres.nummultirange',
  numrange: 'postgres.numrange',
  oid: 'number.int',
  path: 'postgres.path',
  point: 'postgres.point',
  polygon: 'postgres.polygon',
  tsmultirange: 'postgres.tsmultirange',
  tsquery: 'lorem.word',
  tsrange: 'postgres.tsrange',
  tstzmultirange: 'postgres.tsmultirange',
  tstzrange: 'postgres.tsrange',
  tsvector: 'lorem.sentence',
  varbit: 'number.binary',
  xml: 'lorem.sentence',
}

export const pgAutoDetect = (label: string): GeneratorId | undefined =>
  TYPE_TO_GENERATOR[label]

import type { GeneratorId } from '..'

const TYPE_TO_GENERATOR: Record<string, GeneratorId> = {
  int4range: 'postgres.intrange',
  int8range: 'postgres.intrange',
  numrange: 'postgres.numrange',
  daterange: 'postgres.daterange',
  tsrange: 'postgres.tsrange',
  tstzrange: 'postgres.tsrange',
  int4multirange: 'postgres.intmultirange',
  int8multirange: 'postgres.intmultirange',
  nummultirange: 'postgres.nummultirange',
  datemultirange: 'postgres.datemultirange',
  tsmultirange: 'postgres.tsmultirange',
  tstzmultirange: 'postgres.tsmultirange',
  bit: 'number.binary',
  varbit: 'number.binary',
  bytea: 'string.hexadecimal',
  xml: 'lorem.sentence',
  tsvector: 'lorem.sentence',
  tsquery: 'lorem.word',
  inet: 'internet.ip',
  cidr: 'internet.ip',
  inet6: 'internet.ipv6',
  macaddr: 'internet.mac',
  macaddr8: 'internet.mac',
  point: 'postgres.point',
  line: 'postgres.line',
  lseg: 'postgres.lseg',
  box: 'postgres.box',
  path: 'postgres.path',
  polygon: 'postgres.polygon',
  circle: 'postgres.circle',
  interval: 'postgres.interval',
  oid: 'number.int',
}

export function pgAutoDetect(label: string): GeneratorId | undefined {
  return TYPE_TO_GENERATOR[label]
}

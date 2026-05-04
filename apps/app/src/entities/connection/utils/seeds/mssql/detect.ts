import type { GeneratorId } from '..'

const TYPE_TO_GENERATOR: Record<string, GeneratorId> = {
  bit: 'mssql.bit',
  tinyint: 'mssql.tinyint',
  uniqueidentifier: 'mssql.uniqueidentifier',
  date: 'mssql.date',
  datetime: 'mssql.datetime',
  datetime2: 'mssql.datetime2',
  smalldatetime: 'mssql.smalldatetime',
  datetimeoffset: 'mssql.datetimeoffset',
  time: 'mssql.time',
  money: 'mssql.money',
  smallmoney: 'mssql.smallmoney',
  binary: 'mssql.binary',
  varbinary: 'mssql.binary',
  image: 'mssql.binary',
  xml: 'mssql.xml',
  geometry: 'mssql.geometry',
  geography: 'mssql.geography',
}

export function mssqlAutoDetect(label: string): GeneratorId | undefined {
  return TYPE_TO_GENERATOR[label]
}

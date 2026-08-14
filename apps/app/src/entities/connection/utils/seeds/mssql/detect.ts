import type { GeneratorId } from '..'

const TYPE_TO_GENERATOR: Record<string, GeneratorId> = {
  binary: 'mssql.binary',
  bit: 'mssql.bit',
  date: 'mssql.date',
  datetime: 'mssql.datetime',
  datetime2: 'mssql.datetime2',
  datetimeoffset: 'mssql.datetimeoffset',
  geography: 'mssql.geography',
  geometry: 'mssql.geometry',
  image: 'mssql.binary',
  money: 'mssql.money',
  smalldatetime: 'mssql.smalldatetime',
  smallmoney: 'mssql.smallmoney',
  time: 'mssql.time',
  tinyint: 'mssql.tinyint',
  uniqueidentifier: 'mssql.uniqueidentifier',
  varbinary: 'mssql.binary',
  xml: 'mssql.xml',
}

export const mssqlAutoDetect = (label: string): GeneratorId | undefined =>
  TYPE_TO_GENERATOR[label]

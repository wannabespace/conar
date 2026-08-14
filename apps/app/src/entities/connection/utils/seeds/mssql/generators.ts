import { faker } from '@faker-js/faker'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import type { GeneratorMap } from '..'

const XML_TAG_SANITIZE_REGEX = /[^a-z0-9]/giu

export const MSSQL_GENERATORS = {
  'mssql.binary': {
    category: 'MSSQL',
    generate: () =>
      sql`CONVERT(varbinary(max), ${faker.string.hexadecimal({ length: 32, prefix: '' })}, 2)`,
    label: 'Binary',
  },
  'mssql.bit': {
    category: 'MSSQL',
    generate: () => faker.number.int({ max: 1, min: 0 }),
    label: 'Bit',
  },
  'mssql.date': {
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().slice(0, 10),
    label: 'Date',
  },
  'mssql.datetime': {
    category: 'MSSQL',
    generate: () =>
      faker.date.recent().toISOString().slice(0, 19).replace('T', ' '),
    label: 'Datetime',
  },
  'mssql.datetime2': {
    category: 'MSSQL',
    generate: () =>
      faker.date.recent().toISOString().slice(0, 23).replace('T', ' '),
    label: 'Datetime2',
  },
  'mssql.datetimeoffset': {
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().replace('T', ' '),
    label: 'Datetime Offset',
  },
  'mssql.geography': {
    category: 'MSSQL Spatial',
    generate: () => {
      const lat = faker.location.latitude()
      const lng = faker.location.longitude()
      return sql.raw(`geography::Point(${lat}, ${lng}, 4326)`)
    },
    label: 'Geography Point',
  },
  'mssql.geometry': {
    category: 'MSSQL Spatial',
    generate: () => {
      const lat = faker.location.latitude()
      const lng = faker.location.longitude()
      return sql.raw(`geometry::Point(${lat}, ${lng}, 0)`)
    },
    label: 'Geometry Point',
  },
  'mssql.money': {
    category: 'MSSQL',
    generate: () =>
      Number(faker.finance.amount({ dec: 2, max: 100_000, min: 0 })),
    label: 'Money',
  },
  'mssql.smalldatetime': {
    category: 'MSSQL',
    generate: () =>
      faker.date.recent().toISOString().slice(0, 16).replace('T', ' '),
    label: 'Small Datetime',
  },
  'mssql.smallmoney': {
    category: 'MSSQL',
    generate: () =>
      Number(faker.finance.amount({ dec: 2, max: 10_000, min: 0 })),
    label: 'Small Money',
  },
  'mssql.time': {
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().slice(11, 19),
    label: 'Time',
  },
  'mssql.tinyint': {
    category: 'MSSQL',
    generate: () => faker.number.int({ max: 255, min: 0 }),
    label: 'Tiny Int',
  },
  'mssql.uniqueidentifier': {
    category: 'MSSQL',
    generate: () => faker.string.uuid({ version: 4 }),
    label: 'Unique Identifier',
  },
  'mssql.xml': {
    category: 'MSSQL',
    generate: () => {
      const tag =
        faker.hacker.noun().replace(XML_TAG_SANITIZE_REGEX, '').toLowerCase() ||
        'item'
      const value = faker.lorem.words({ max: 5, min: 2 })
      return `<${tag}>${value}</${tag}>`
    },
    label: 'XML',
  },
} satisfies GeneratorMap<ConnectionType.MSSQL>

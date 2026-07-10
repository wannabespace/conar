import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { GeneratorMap } from '..'
import { faker } from '@faker-js/faker'
import { sql } from 'kysely'

const XML_TAG_SANITIZE_REGEX = /[^a-z0-9]/gi

export const MSSQL_GENERATORS = {
  'mssql.uniqueidentifier': {
    label: 'Unique Identifier',
    category: 'MSSQL',
    generate: () => faker.string.uuid({ version: 4 }),
  },
  'mssql.date': {
    label: 'Date',
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().slice(0, 10),
  },
  'mssql.datetime': {
    label: 'Datetime',
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().slice(0, 19).replace('T', ' '),
  },
  'mssql.datetime2': {
    label: 'Datetime2',
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().slice(0, 23).replace('T', ' '),
  },
  'mssql.datetimeoffset': {
    label: 'Datetime Offset',
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().replace('T', ' '),
  },
  'mssql.time': {
    label: 'Time',
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().slice(11, 19),
  },
  'mssql.smalldatetime': {
    label: 'Small Datetime',
    category: 'MSSQL',
    generate: () => faker.date.recent().toISOString().slice(0, 16).replace('T', ' '),
  },
  'mssql.bit': {
    label: 'Bit',
    category: 'MSSQL',
    generate: () => faker.number.int({ min: 0, max: 1 }),
  },
  'mssql.tinyint': {
    label: 'Tiny Int',
    category: 'MSSQL',
    generate: () => faker.number.int({ min: 0, max: 255 }),
  },
  'mssql.money': {
    label: 'Money',
    category: 'MSSQL',
    generate: () => Number(faker.finance.amount({ min: 0, max: 100000, dec: 2 })),
  },
  'mssql.smallmoney': {
    label: 'Small Money',
    category: 'MSSQL',
    generate: () => Number(faker.finance.amount({ min: 0, max: 10000, dec: 2 })),
  },
  'mssql.xml': {
    label: 'XML',
    category: 'MSSQL',
    generate: () => {
      const tag = faker.hacker.noun().replace(XML_TAG_SANITIZE_REGEX, '').toLowerCase() || 'item'
      const value = faker.lorem.words({ min: 2, max: 5 })
      return `<${tag}>${value}</${tag}>`
    },
  },
  'mssql.binary': {
    label: 'Binary',
    category: 'MSSQL',
    generate: () => sql`CONVERT(varbinary(max), ${faker.string.hexadecimal({ length: 32, prefix: '' })}, 2)`,
  },
  'mssql.geography': {
    label: 'Geography Point',
    category: 'MSSQL Spatial',
    generate: () => {
      const lat = faker.location.latitude()
      const lng = faker.location.longitude()
      return sql.raw(`geography::Point(${lat}, ${lng}, 4326)`)
    },
  },
  'mssql.geometry': {
    label: 'Geometry Point',
    category: 'MSSQL Spatial',
    generate: () => {
      const lat = faker.location.latitude()
      const lng = faker.location.longitude()
      return sql.raw(`geometry::Point(${lat}, ${lng}, 0)`)
    },
  },
} satisfies GeneratorMap<ConnectionType.MSSQL>

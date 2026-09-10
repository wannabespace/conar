import { faker } from '@faker-js/faker'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import type { GeneratorMap } from '../types'

const XML_TAG_SANITIZE_REGEX = /[^a-z0-9]/giu

export const MSSQL_GENERATORS = {
  'mssql.binary': {
    category: 'MSSQL',
    generate: () =>
      sql`CONVERT(varbinary(max), ${faker.string.hexadecimal({ length: 32, prefix: '' })}, 2)`,
    label: 'Binary',
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

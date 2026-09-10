import { faker } from '@faker-js/faker'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { inCategory } from '../base'
import type { GeneratorMap } from '../types'

const XML_TAG_SANITIZE_REGEX = /[^a-z0-9]/giu

export const MSSQL_GENERATORS = {
  ...inCategory('MSSQL', {
    'mssql.binary': [
      'Binary',
      () =>
        sql`CONVERT(varbinary(max), ${faker.string.hexadecimal({ length: 32, prefix: '' })}, 2)`,
    ],
    'mssql.xml': [
      'XML',
      () => {
        const tag =
          faker.hacker
            .noun()
            .replace(XML_TAG_SANITIZE_REGEX, '')
            .toLowerCase() || 'item'
        return `<${tag}>${faker.lorem.words({ max: 5, min: 2 })}</${tag}>`
      },
    ],
  }),
  ...inCategory('MSSQL Spatial', {
    'mssql.geography': [
      'Geography Point',
      () =>
        sql.raw(
          `geography::Point(${faker.location.latitude()}, ${faker.location.longitude()}, 4326)`
        ),
    ],
    'mssql.geometry': [
      'Geometry Point',
      () =>
        sql.raw(
          `geometry::Point(${faker.location.latitude()}, ${faker.location.longitude()}, 0)`
        ),
    ],
  }),
} satisfies GeneratorMap<ConnectionType.MSSQL>

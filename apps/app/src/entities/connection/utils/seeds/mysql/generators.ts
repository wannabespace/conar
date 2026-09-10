import { faker } from '@faker-js/faker'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { inCategory } from '../base'
import type { GeneratorMap } from '../types'

const wkt = (expr: string) => sql`ST_GeomFromText(${expr})`

const point = () => `${faker.location.longitude()} ${faker.location.latitude()}`

const many = (one: () => string, count: { max: number; min: number }) =>
  faker.helpers.multiple(one, { count }).join(', ')

const lineString = () => many(point, { max: 5, min: 2 })

const linearRing = () => {
  const first = point()
  return [first, many(point, { max: 5, min: 2 }), first].join(', ')
}

export const MYSQL_GENERATORS = {
  ...inCategory('MySQL', {
    'mysql.binary': [
      'Binary',
      () => sql`UNHEX(${faker.string.hexadecimal({ length: 32, prefix: '' })})`,
    ],
    'mysql.year': ['Year', () => faker.number.int({ max: 2155, min: 1901 })],
  }),
  ...inCategory('MySQL Spatial', {
    'mysql.geometrycollection': [
      'GeometryCollection',
      () =>
        wkt(
          `GEOMETRYCOLLECTION(POINT(${point()}), LINESTRING(${lineString()}))`
        ),
    ],
    'mysql.linestring': [
      'LineString',
      () => wkt(`LINESTRING(${lineString()})`),
    ],
    'mysql.multilinestring': [
      'MultiLineString',
      () =>
        wkt(
          `MULTILINESTRING(${many(() => `(${lineString()})`, { max: 3, min: 2 })})`
        ),
    ],
    'mysql.multipoint': [
      'MultiPoint',
      () =>
        wkt(`MULTIPOINT(${many(() => `(${point()})`, { max: 5, min: 2 })})`),
    ],
    'mysql.multipolygon': [
      'MultiPolygon',
      () =>
        wkt(
          `MULTIPOLYGON(${many(() => `((${linearRing()}))`, { max: 3, min: 2 })})`
        ),
    ],
    'mysql.point': ['Point', () => wkt(`POINT(${point()})`)],
    'mysql.polygon': ['Polygon', () => wkt(`POLYGON((${linearRing()}))`)],
  }),
} satisfies GeneratorMap<ConnectionType.MySQL>

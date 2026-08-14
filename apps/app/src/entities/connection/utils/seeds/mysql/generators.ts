import { faker } from '@faker-js/faker'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import type { GeneratorMap } from '..'

const wkt = (expr: string) => sql`ST_GeomFromText(${expr})`

const randomPoint = () =>
  `${faker.location.longitude()} ${faker.location.latitude()}`

const randomLineString = () => {
  const count = faker.number.int({ max: 5, min: 2 })
  return faker.helpers.multiple(randomPoint, { count }).join(', ')
}

const randomLinearRing = () => {
  const count = faker.number.int({ max: 6, min: 3 })
  const pts = faker.helpers.multiple(randomPoint, { count })
  const [first] = pts
  if (first === undefined) {
    throw new Error('Expected at least one point for linear ring')
  }
  pts.push(first)
  return pts.join(', ')
}

export const MYSQL_GENERATORS = {
  'mysql.binary': {
    category: 'MySQL',
    generate: () =>
      sql`UNHEX(${faker.string.hexadecimal({ length: 32, prefix: '' })})`,
    label: 'Binary',
  },
  'mysql.bit': {
    category: 'MySQL',
    generate: () => faker.number.int({ max: 1, min: 0 }),
    label: 'Bit',
  },
  'mysql.date': {
    category: 'MySQL',
    generate: () => faker.date.recent().toISOString().slice(0, 10),
    label: 'Date',
  },
  'mysql.datetime': {
    category: 'MySQL',
    generate: () =>
      faker.date.recent().toISOString().slice(0, 19).replace('T', ' '),
    label: 'Datetime',
  },
  'mysql.geometrycollection': {
    category: 'MySQL Spatial',
    generate: () => {
      const items = [
        `POINT(${randomPoint()})`,
        `LINESTRING(${randomLineString()})`,
      ]
      return wkt(`GEOMETRYCOLLECTION(${items.join(', ')})`)
    },
    label: 'GeometryCollection',
  },
  'mysql.linestring': {
    category: 'MySQL Spatial',
    generate: () => wkt(`LINESTRING(${randomLineString()})`),
    label: 'LineString',
  },
  'mysql.multilinestring': {
    category: 'MySQL Spatial',
    generate: () => {
      const count = faker.number.int({ max: 3, min: 2 })
      const lines = faker.helpers.multiple(() => `(${randomLineString()})`, {
        count,
      })
      return wkt(`MULTILINESTRING(${lines.join(', ')})`)
    },
    label: 'MultiLineString',
  },
  'mysql.multipoint': {
    category: 'MySQL Spatial',
    generate: () => {
      const count = faker.number.int({ max: 5, min: 2 })
      const pts = faker.helpers.multiple(() => `(${randomPoint()})`, { count })
      return wkt(`MULTIPOINT(${pts.join(', ')})`)
    },
    label: 'MultiPoint',
  },
  'mysql.multipolygon': {
    category: 'MySQL Spatial',
    generate: () => {
      const count = faker.number.int({ max: 3, min: 2 })
      const polys = faker.helpers.multiple(() => `((${randomLinearRing()}))`, {
        count,
      })
      return wkt(`MULTIPOLYGON(${polys.join(', ')})`)
    },
    label: 'MultiPolygon',
  },
  'mysql.point': {
    category: 'MySQL Spatial',
    generate: () => wkt(`POINT(${randomPoint()})`),
    label: 'Point',
  },
  'mysql.polygon': {
    category: 'MySQL Spatial',
    generate: () => wkt(`POLYGON((${randomLinearRing()}))`),
    label: 'Polygon',
  },
  'mysql.year': {
    category: 'MySQL',
    generate: () => faker.number.int({ max: 2155, min: 1901 }),
    label: 'Year',
  },
} satisfies GeneratorMap<ConnectionType.MySQL>

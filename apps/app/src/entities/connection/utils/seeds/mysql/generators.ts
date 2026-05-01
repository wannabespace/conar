import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { GeneratorMap } from '..'
import { faker } from '@faker-js/faker'
import { sql } from 'kysely'

function wkt(expr: string) {
  return sql`ST_GeomFromText(${expr})`
}

function randomPoint() {
  return `${faker.location.longitude()} ${faker.location.latitude()}`
}

function randomLineString() {
  const count = faker.number.int({ min: 2, max: 5 })
  return faker.helpers.multiple(randomPoint, { count }).join(', ')
}

function randomLinearRing() {
  const count = faker.number.int({ min: 3, max: 6 })
  const pts = faker.helpers.multiple(randomPoint, { count })
  pts.push(pts[0]!)
  return pts.join(', ')
}

export const MYSQL_GENERATORS = {
  'mysql.date': {
    label: 'Date',
    category: 'MySQL',
    generate: () => faker.date.recent().toISOString().slice(0, 10),
  },
  'mysql.datetime': {
    label: 'Datetime',
    category: 'MySQL',
    generate: () => faker.date.recent().toISOString().slice(0, 19).replace('T', ' '),
  },
  'mysql.year': {
    label: 'Year',
    category: 'MySQL',
    generate: () => faker.number.int({ min: 1901, max: 2155 }),
  },
  'mysql.bit': {
    label: 'Bit',
    category: 'MySQL',
    generate: () => faker.number.int({ min: 0, max: 1 }),
  },
  'mysql.binary': {
    label: 'Binary',
    category: 'MySQL',
    generate: () => sql`UNHEX(${faker.string.hexadecimal({ length: 32, prefix: '' })})`,
  },
  'mysql.point': {
    label: 'Point',
    category: 'MySQL Spatial',
    generate: () => wkt(`POINT(${randomPoint()})`),
  },
  'mysql.linestring': {
    label: 'LineString',
    category: 'MySQL Spatial',
    generate: () => wkt(`LINESTRING(${randomLineString()})`),
  },
  'mysql.polygon': {
    label: 'Polygon',
    category: 'MySQL Spatial',
    generate: () => wkt(`POLYGON((${randomLinearRing()}))`),
  },
  'mysql.multipoint': {
    label: 'MultiPoint',
    category: 'MySQL Spatial',
    generate: () => {
      const count = faker.number.int({ min: 2, max: 5 })
      const pts = faker.helpers.multiple(() => `(${randomPoint()})`, { count })
      return wkt(`MULTIPOINT(${pts.join(', ')})`)
    },
  },
  'mysql.multilinestring': {
    label: 'MultiLineString',
    category: 'MySQL Spatial',
    generate: () => {
      const count = faker.number.int({ min: 2, max: 3 })
      const lines = faker.helpers.multiple(() => `(${randomLineString()})`, { count })
      return wkt(`MULTILINESTRING(${lines.join(', ')})`)
    },
  },
  'mysql.multipolygon': {
    label: 'MultiPolygon',
    category: 'MySQL Spatial',
    generate: () => {
      const count = faker.number.int({ min: 2, max: 3 })
      const polys = faker.helpers.multiple(() => `((${randomLinearRing()}))`, { count })
      return wkt(`MULTIPOLYGON(${polys.join(', ')})`)
    },
  },
  'mysql.geometrycollection': {
    label: 'GeometryCollection',
    category: 'MySQL Spatial',
    generate: () => {
      const items = [
        `POINT(${randomPoint()})`,
        `LINESTRING(${randomLineString()})`,
      ]
      return wkt(`GEOMETRYCOLLECTION(${items.join(', ')})`)
    },
  },
} satisfies GeneratorMap<ConnectionType.MySQL>

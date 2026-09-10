import { faker } from '@faker-js/faker'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { inCategory } from '../base'
import type { GeneratorMap } from '../types'

const point = () =>
  `(${faker.location.longitude()},${faker.location.latitude()})`

const points = (count: { max: number; min: number }) =>
  faker.helpers.multiple(point, { count }).join(',')

const lineCoefficient = () =>
  faker.number.float({ fractionDigits: 4, max: 100, min: -100 })

const range =
  <T>(lower: () => T, upper: (lower: T) => T, format: (value: T) => string) =>
  () => {
    const a = lower()
    return `[${format(a)},${format(upper(a))})`
  }

const multirange = (one: () => string) => () =>
  `{${faker.helpers.multiple(one, { count: { max: 3, min: 1 } }).join(',')}}`

const dateRange = range(
  () => faker.date.past(),
  (a) => faker.date.future({ refDate: a }),
  (date) => date.toISOString().slice(0, 10)
)
const tsRange = range(
  () => faker.date.past(),
  (a) => faker.date.future({ refDate: a }),
  (date) => date.toISOString()
)
const intRange = range(
  () => faker.number.int({ max: 10_000, min: -10_000 }),
  (a) => faker.number.int({ max: a + 10_000, min: a + 1 }),
  String
)
const numRange = range(
  () => faker.number.float({ fractionDigits: 2, max: 10_000, min: -10_000 }),
  (a) =>
    faker.number.float({ fractionDigits: 2, max: a + 10_000, min: a + 0.01 }),
  String
)

export const PG_GENERATORS = inCategory('Postgres', {
  'postgres.box': ['Box', () => `${point()},${point()}`],
  'postgres.bytea': [
    'Bytea',
    () =>
      sql`decode(${faker.string.hexadecimal({ length: 32, prefix: '' })}, 'hex')`,
  ],
  'postgres.circle': [
    'Circle',
    () =>
      `<${point()},${faker.number.float({ fractionDigits: 2, max: 100, min: 0.1 })}>`,
  ],
  'postgres.datemultirange': ['Date Multirange', multirange(dateRange)],
  'postgres.daterange': ['Date Range', dateRange],
  'postgres.geometry': [
    'PostGIS Point',
    () =>
      sql`ST_GeomFromText(${`POINT(${faker.location.longitude()} ${faker.location.latitude()})`}, 4326)`,
  ],
  'postgres.hstore': [
    'Hstore',
    () =>
      faker.helpers
        .uniqueArray(
          () => faker.lorem.slug(1),
          faker.number.int({ max: 4, min: 1 })
        )
        .map((key) => `"${key}"=>"${faker.lorem.word()}"`)
        .join(', '),
  ],
  'postgres.interval': [
    'Interval',
    () =>
      `${faker.number.int({ max: 99 })} ${faker.helpers.arrayElement(['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'])}`,
  ],
  'postgres.intmultirange': ['Int Multirange', multirange(intRange)],
  'postgres.intrange': ['Int Range', intRange],
  'postgres.line': [
    'Line {A,B,C}',
    () => `{${lineCoefficient()},${lineCoefficient()},${lineCoefficient()}}`,
  ],
  'postgres.lseg': ['Line Segment', () => `[${point()},${point()}]`],
  'postgres.ltree': [
    'Ltree',
    () =>
      faker.helpers
        .multiple(() => faker.lorem.word(), { count: { max: 4, min: 1 } })
        .join('.'),
  ],
  'postgres.nummultirange': ['Numeric Multirange', multirange(numRange)],
  'postgres.numrange': ['Numeric Range', numRange],
  'postgres.path': ['Path', () => `[${points({ max: 5, min: 2 })}]`],
  'postgres.point': ['Point (x,y)', point],
  'postgres.polygon': ['Polygon', () => `(${points({ max: 6, min: 3 })})`],
  'postgres.tsmultirange': ['Timestamp Multirange', multirange(tsRange)],
  'postgres.tsrange': ['Timestamp Range', tsRange],
}) satisfies GeneratorMap<ConnectionType.Postgres>

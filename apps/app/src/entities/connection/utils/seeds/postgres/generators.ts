import { faker } from '@faker-js/faker'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { GeneratorMap } from '..'

export const PG_GENERATORS = {
  'postgres.box': {
    category: 'Postgres',
    generate: () =>
      `(${faker.location.longitude()},${faker.location.latitude()}),(${faker.location.longitude()},${faker.location.latitude()})`,
    label: 'Box',
  },
  'postgres.circle': {
    category: 'Postgres',
    generate: () =>
      `<(${faker.location.longitude()},${faker.location.latitude()}),${faker.number.float({ fractionDigits: 2, max: 100, min: 0.1 })}>`,
    label: 'Circle',
  },
  'postgres.datemultirange': {
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(
        () => {
          const a = faker.date.past()
          const b = faker.date.future({ refDate: a })
          return `[${a.toISOString().slice(0, 10)},${b.toISOString().slice(0, 10)})`
        },
        { count: faker.number.int({ max: 3, min: 1 }) }
      )
      return `{${ranges.join(',')}}`
    },
    label: 'Date Multirange',
  },
  'postgres.daterange': {
    category: 'Postgres',
    generate: () => {
      const a = faker.date.past()
      const b = faker.date.future({ refDate: a })
      return `[${a.toISOString().slice(0, 10)},${b.toISOString().slice(0, 10)})`
    },
    label: 'Date Range',
  },
  'postgres.interval': {
    category: 'Postgres',
    generate: () =>
      `${faker.number.int({ max: 99, min: 0 })} ${faker.helpers.arrayElement(['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'])}`,
    label: 'Interval',
  },
  'postgres.intmultirange': {
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(
        () => {
          const a = faker.number.int({ max: 10_000, min: -10_000 })
          return `[${a},${faker.number.int({ max: a + 10_000, min: a + 1 })})`
        },
        { count: faker.number.int({ max: 3, min: 1 }) }
      )
      return `{${ranges.join(',')}}`
    },
    label: 'Int Multirange',
  },
  'postgres.intrange': {
    category: 'Postgres',
    generate: () => {
      const a = faker.number.int({ max: 10_000, min: -10_000 })
      const b = faker.number.int({ max: a + 10_000, min: a + 1 })
      return `[${a},${b})`
    },
    label: 'Int Range',
  },
  'postgres.line': {
    category: 'Postgres',
    generate: () =>
      `{${faker.number.float({ fractionDigits: 4, max: 100, min: -100 })},${faker.number.float({ fractionDigits: 4, max: 100, min: -100 })},${faker.number.float({ fractionDigits: 4, max: 100, min: -100 })}}`,
    label: 'Line {A,B,C}',
  },
  'postgres.lseg': {
    category: 'Postgres',
    generate: () =>
      `[(${faker.location.longitude()},${faker.location.latitude()}),(${faker.location.longitude()},${faker.location.latitude()})]`,
    label: 'Line Segment',
  },
  'postgres.nummultirange': {
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(
        () => {
          const a = faker.number.float({
            fractionDigits: 2,
            max: 10_000,
            min: -10_000,
          })
          return `[${a},${faker.number.float({ fractionDigits: 2, max: a + 10_000, min: a + 0.01 })})`
        },
        { count: faker.number.int({ max: 3, min: 1 }) }
      )
      return `{${ranges.join(',')}}`
    },
    label: 'Numeric Multirange',
  },
  'postgres.numrange': {
    category: 'Postgres',
    generate: () => {
      const a = faker.number.float({
        fractionDigits: 2,
        max: 10_000,
        min: -10_000,
      })
      const b = faker.number.float({
        fractionDigits: 2,
        max: a + 10_000,
        min: a + 0.01,
      })
      return `[${a},${b})`
    },
    label: 'Numeric Range',
  },
  'postgres.path': {
    category: 'Postgres',
    generate: () => {
      const pts = faker.helpers.multiple(
        () => `(${faker.location.longitude()},${faker.location.latitude()})`,
        { count: faker.number.int({ max: 5, min: 2 }) }
      )
      return `[${pts.join(',')}]`
    },
    label: 'Path',
  },
  'postgres.point': {
    category: 'Postgres',
    generate: () =>
      `(${faker.location.longitude()},${faker.location.latitude()})`,
    label: 'Point (x,y)',
  },
  'postgres.polygon': {
    category: 'Postgres',
    generate: () => {
      const pts = faker.helpers.multiple(
        () => `(${faker.location.longitude()},${faker.location.latitude()})`,
        { count: faker.number.int({ max: 6, min: 3 }) }
      )
      return `(${pts.join(',')})`
    },
    label: 'Polygon',
  },
  'postgres.tsmultirange': {
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(
        () => {
          const a = faker.date.past()
          const b = faker.date.future({ refDate: a })
          return `[${a.toISOString()},${b.toISOString()})`
        },
        { count: faker.number.int({ max: 3, min: 1 }) }
      )
      return `{${ranges.join(',')}}`
    },
    label: 'Timestamp Multirange',
  },
  'postgres.tsrange': {
    category: 'Postgres',
    generate: () => {
      const a = faker.date.past()
      const b = faker.date.future({ refDate: a })
      return `[${a.toISOString()},${b.toISOString()})`
    },
    label: 'Timestamp Range',
  },
} satisfies GeneratorMap<ConnectionType.Postgres>

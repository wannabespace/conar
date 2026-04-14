import type { GeneratorMap } from '..'
import { faker } from '@faker-js/faker'

export const PG_GENERATORS = {
  'pg.point': { label: 'Point (x,y)', category: 'Postgres', generate: () => `(${faker.location.longitude()},${faker.location.latitude()})` },
  'pg.line': { label: 'Line {A,B,C}', category: 'Postgres', generate: () => `{${faker.number.float({ min: -100, max: 100, fractionDigits: 4 })},${faker.number.float({ min: -100, max: 100, fractionDigits: 4 })},${faker.number.float({ min: -100, max: 100, fractionDigits: 4 })}}` },
  'pg.lseg': { label: 'Line Segment', category: 'Postgres', generate: () => `[(${faker.location.longitude()},${faker.location.latitude()}),(${faker.location.longitude()},${faker.location.latitude()})]` },
  'pg.box': { label: 'Box', category: 'Postgres', generate: () => `(${faker.location.longitude()},${faker.location.latitude()}),(${faker.location.longitude()},${faker.location.latitude()})` },
  'pg.path': {
    label: 'Path',
    category: 'Postgres',
    generate: () => {
      const pts = faker.helpers.multiple(() => `(${faker.location.longitude()},${faker.location.latitude()})`, { count: faker.number.int({ min: 2, max: 5 }) })
      return `[${pts.join(',')}]`
    },
  },
  'pg.polygon': {
    label: 'Polygon',
    category: 'Postgres',
    generate: () => {
      const pts = faker.helpers.multiple(() => `(${faker.location.longitude()},${faker.location.latitude()})`, { count: faker.number.int({ min: 3, max: 6 }) })
      return `(${pts.join(',')})`
    },
  },
  'pg.circle': { label: 'Circle', category: 'Postgres', generate: () => `<(${faker.location.longitude()},${faker.location.latitude()}),${faker.number.float({ min: 0.1, max: 100, fractionDigits: 2 })}>` },
  'pg.interval': { label: 'Interval', category: 'Postgres', generate: () => `${faker.number.int({ min: 0, max: 99 })} ${faker.helpers.arrayElement(['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'])}` },
  'pg.intrange': {
    label: 'Int Range',
    category: 'Postgres',
    generate: () => {
      const a = faker.number.int({ min: -10000, max: 10000 })
      const b = faker.number.int({ min: a + 1, max: a + 10000 })
      return `[${a},${b})`
    },
  },
  'pg.numrange': {
    label: 'Numeric Range',
    category: 'Postgres',
    generate: () => {
      const a = faker.number.float({ min: -10000, max: 10000, fractionDigits: 2 })
      const b = faker.number.float({ min: a + 0.01, max: a + 10000, fractionDigits: 2 })
      return `[${a},${b})`
    },
  },
  'pg.daterange': {
    label: 'Date Range',
    category: 'Postgres',
    generate: () => {
      const a = faker.date.past()
      const b = faker.date.future({ refDate: a })
      return `[${a.toISOString().slice(0, 10)},${b.toISOString().slice(0, 10)})`
    },
  },
  'pg.tsrange': {
    label: 'Timestamp Range',
    category: 'Postgres',
    generate: () => {
      const a = faker.date.past()
      const b = faker.date.future({ refDate: a })
      return `[${a.toISOString()},${b.toISOString()})`
    },
  },
  'pg.intmultirange': {
    label: 'Int Multirange',
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(() => {
        const a = faker.number.int({ min: -10000, max: 10000 })
        return `[${a},${faker.number.int({ min: a + 1, max: a + 10000 })})`
      }, { count: faker.number.int({ min: 1, max: 3 }) })
      return `{${ranges.join(',')}}`
    },
  },
  'pg.nummultirange': {
    label: 'Numeric Multirange',
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(() => {
        const a = faker.number.float({ min: -10000, max: 10000, fractionDigits: 2 })
        return `[${a},${faker.number.float({ min: a + 0.01, max: a + 10000, fractionDigits: 2 })})`
      }, { count: faker.number.int({ min: 1, max: 3 }) })
      return `{${ranges.join(',')}}`
    },
  },
  'pg.datemultirange': {
    label: 'Date Multirange',
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(() => {
        const a = faker.date.past()
        const b = faker.date.future({ refDate: a })
        return `[${a.toISOString().slice(0, 10)},${b.toISOString().slice(0, 10)})`
      }, { count: faker.number.int({ min: 1, max: 3 }) })
      return `{${ranges.join(',')}}`
    },
  },
  'pg.tsmultirange': {
    label: 'Timestamp Multirange',
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(() => {
        const a = faker.date.past()
        const b = faker.date.future({ refDate: a })
        return `[${a.toISOString()},${b.toISOString()})`
      }, { count: faker.number.int({ min: 1, max: 3 }) })
      return `{${ranges.join(',')}}`
    },
  },
} satisfies GeneratorMap

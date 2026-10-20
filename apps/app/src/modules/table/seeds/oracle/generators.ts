import { faker } from '@faker-js/faker/locale/en'
import type { Dialect } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { columnTypeName, inCategory } from '../base'
import type { GeneratorMap } from '../types'

const MAX_RAW_BYTES = 16
const RAW_LENGTH = /^RAW\((?<bytes>\d+)\)/iu
const MAX_INTERVAL_SECONDS = 30 * 24 * 60 * 60
const MAX_INTERVAL_MONTHS = 240

export const ORACLE_GENERATORS = inCategory('Oracle', {
  'oracle.binary': [
    'Binary',
    (column) =>
      sql`hextoraw(${faker.string.hexadecimal({
        length:
          2 *
          Math.min(
            MAX_RAW_BYTES,
            Number(
              RAW_LENGTH.exec(column.declaredType ?? '')?.groups?.bytes ??
                MAX_RAW_BYTES
            )
          ),
        prefix: '',
      })})`,
  ],
  'oracle.interval': [
    'Interval',
    (column) =>
      columnTypeName(column).includes('year')
        ? sql`numtoyminterval(${faker.number.int({ max: MAX_INTERVAL_MONTHS })}, 'MONTH')`
        : sql`numtodsinterval(${faker.number.int({ max: MAX_INTERVAL_SECONDS })}, 'SECOND')`,
  ],
  'oracle.xml': [
    'XML',
    () =>
      sql`xmltype(${`<item>${faker.lorem.words({ max: 5, min: 2 })}</item>`})`,
  ],
}) satisfies GeneratorMap<Dialect.Oracle>

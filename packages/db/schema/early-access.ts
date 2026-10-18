import * as d from 'drizzle-orm/pg-core'

import { baseTable } from '../base-table'

export const earlyAccess = d.snakeCase.table('early_access', {
  ...baseTable,
  email: d.text().notNull().unique(),
  grantedAt: d.timestamp({ withTimezone: true }),
})

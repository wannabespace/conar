import { timestamp, uuid } from 'drizzle-orm/pg-core'
import { v7 } from 'uuid'

export const baseTable = {
  id: uuid().$defaultFn(v7).primaryKey(),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
}

import { timestamp, uuid } from 'drizzle-orm/pg-core'
import { v7 } from 'uuid'

export const baseTable = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  id: uuid().$defaultFn(v7).primaryKey(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}

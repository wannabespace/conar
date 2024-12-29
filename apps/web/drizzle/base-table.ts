import { timestamp, uuid } from 'drizzle-orm/pg-core'
import { v7 } from 'uuid'

export const baseTable = {
  id: uuid('id').$defaultFn(v7).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}

import type { Stripe } from 'stripe'
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { users } from './auth'

export const subscriptions = pgTable('subscriptions', {
  ...baseTable,
  plan: text().notNull().$type<'pro'>(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text(),
  status: text().$type<Stripe.Subscription.Status>().default('incomplete'),
  periodStart: timestamp({ withTimezone: true }),
  periodEnd: timestamp({ withTimezone: true }),
  trialStart: timestamp({ withTimezone: true }),
  trialEnd: timestamp({ withTimezone: true }),
  cancelAtPeriodEnd: boolean().default(false),
}, table => [index().on(table.userId)])

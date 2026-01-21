import type { Stripe } from 'stripe'
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { users } from './auth'

export const subscriptionPeriod = pgEnum('subscription_period', ['monthly', 'yearly'] as const)

export const subscriptions = pgTable('subscriptions', {
  ...baseTable,
  plan: text().notNull().$type<'pro'>(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text(),
  status: text().$type<Stripe.Subscription.Status>().default('incomplete'),
  period: subscriptionPeriod().notNull(),
  price: integer().notNull(),
  periodStart: timestamp({ withTimezone: true }),
  periodEnd: timestamp({ withTimezone: true }),
  trialStart: timestamp({ withTimezone: true }),
  trialEnd: timestamp({ withTimezone: true }),
  cancelAt: timestamp({ withTimezone: true }),
  cancelAtPeriodEnd: boolean().default(false),
})

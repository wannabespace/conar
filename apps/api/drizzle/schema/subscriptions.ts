import type Stripe from 'stripe'
import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { users } from './auth'

// Strange solution to fix TS compiler error
export type SubscriptionStatus = Extract<Stripe.Subscription.Status, string>

export const subscriptionPeriod = pgEnum('subscription_period', ['monthly', 'yearly'])

export const subscriptions = pgTable('subscriptions', {
  ...baseTable,
  plan: text().notNull().$type<'pro'>(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text(),
  status: text().$type<SubscriptionStatus>().default('incomplete'),
  period: subscriptionPeriod().notNull(),
  price: numeric({ mode: 'number' }).notNull(),
  periodStart: timestamp({ withTimezone: true }),
  periodEnd: timestamp({ withTimezone: true }),
  trialStart: timestamp({ withTimezone: true }),
  trialEnd: timestamp({ withTimezone: true }),
  cancelAt: timestamp({ withTimezone: true }),
  cancelAtPeriodEnd: boolean().default(false),
})

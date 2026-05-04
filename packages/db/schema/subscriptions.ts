import type Stripe from 'stripe'
import * as d from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { users } from './auth'

// Strange solution to fix TS compiler error
export type SubscriptionStatus = Extract<Stripe.Subscription.Status, string>

export const subscriptionPeriod = d.pgEnum('subscription_period', ['monthly', 'yearly'])

export const subscriptions = d.snakeCase.table('subscriptions', {
  ...baseTable,
  plan: d.text().notNull().$type<'pro'>(),
  userId: d.uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: d.text(),
  status: d.text().$type<SubscriptionStatus>().default('incomplete'),
  period: subscriptionPeriod().notNull(),
  price: d.numeric({ mode: 'number' }).notNull(),
  periodStart: d.timestamp({ withTimezone: true }),
  periodEnd: d.timestamp({ withTimezone: true }),
  trialStart: d.timestamp({ withTimezone: true }),
  trialEnd: d.timestamp({ withTimezone: true }),
  cancelAt: d.timestamp({ withTimezone: true }),
  cancelAtPeriodEnd: d.boolean().default(false),
})

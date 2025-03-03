import type Stripe from 'stripe'
import { relations } from 'drizzle-orm'
import { jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { users } from './auth'

export const subscriptionPeriod = pgEnum('subscription_period', ['monthly', 'yearly'])

export const subscriptions = pgTable('subscriptions', {
  ...baseTable,
  userId: uuid().references(() => users.id).notNull(),
  stripeCustomerId: text().notNull(),
  stripeSubscriptionId: text().notNull(),
  status: text().notNull().$type<Stripe.Subscription['status']>(),
  data: jsonb().notNull().$type<Stripe.Subscription>(),
  period: subscriptionPeriod().notNull(),
}).enableRLS()

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}))

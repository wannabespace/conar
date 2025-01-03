import type Stripe from 'stripe'
import { relations } from 'drizzle-orm'
import { jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { users } from './auth'

export const subscriptionPeriod = pgEnum('subscription_period', ['monthly', 'yearly'])

export const subscriptions = pgTable('subscriptions', {
  ...baseTable,
  userId: uuid('user_id').references(() => users.id).notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  status: text('status').notNull().$type<Stripe.Subscription['status']>(),
  data: jsonb().notNull().$type<Stripe.Subscription>(),
  period: subscriptionPeriod('period').notNull(),
}).enableRLS()

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}))

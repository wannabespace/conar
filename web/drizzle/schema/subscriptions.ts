import type Stripe from 'stripe'
import { jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'

export const subscriptionType = pgEnum('subscription_type', ['monthly', 'yearly'])

export const subscriptions = pgTable('subscriptions', {
  ...baseTable,
  userId: text('user_id').notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  data: jsonb().notNull().$type<Stripe.Subscription>(),
  type: subscriptionType().notNull(),
})

import Stripe from 'stripe'
import { env } from '~/env'

export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  appInfo: {
    name: 'Conar',
    url: env.WEB_URL,
  },
}) : null

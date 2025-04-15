import Stripe from 'stripe'
import { env } from '~/env'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
  appInfo: {
    name: 'Connnect',
    url: env.WEB_URL,
  },
})

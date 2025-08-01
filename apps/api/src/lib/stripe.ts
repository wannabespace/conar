import Stripe from 'stripe'
import { env } from '~/env'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  appInfo: {
    name: 'Conar',
    url: env.WEB_URL,
  },
})

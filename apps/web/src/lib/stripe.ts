import Stripe from 'stripe'
import { env } from '~/lib/env-server'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  appInfo: {
    name: 'Connnect',
    url: env.VITE_PUBLIC_URL,
  },
})

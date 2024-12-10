import Stripe from 'stripe'
import { env } from '~/env'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  appInfo: {
    name: 'Connnect',
    url: env.NEXT_PUBLIC_URL,
  },
})

export async function getStripeCustomerIdByEmail(email: string) {
  const existingCustomer = await stripe.customers.search({
    query: `email: "${email}"`,
  })

  return existingCustomer.data[0]?.id || null
}

import { createClerkClient } from '@clerk/nextjs/server'
import { env } from '~/env'
import 'server-only'

export const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
})

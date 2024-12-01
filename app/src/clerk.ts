import { Clerk } from '@clerk/clerk-js'

export const clerk = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

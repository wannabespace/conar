import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { router } from '..'
import { profileRouter } from './profile'
import { subscriptionsRouter } from './subscriptions'

export const appRouter = router({
  subscriptions: subscriptionsRouter,
  profile: profileRouter,
})

export type AppRouter = typeof appRouter

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

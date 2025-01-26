import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { router } from '..'
import { databasesRouter } from './databases'
import { profileRouter } from './profile'
import { subscriptionsRouter } from './subscriptions'

export const appRouter = router({
  subscriptions: subscriptionsRouter,
  profile: profileRouter,
  databases: databasesRouter,
})

export type AppRouter = typeof appRouter

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

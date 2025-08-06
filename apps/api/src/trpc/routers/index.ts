import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { router } from '..'
import { aiRouter } from './ai'
import { databasesRouter } from './databases'

export const trpcRouter = router({
  ai: aiRouter,
  databases: databasesRouter,
})

export type AppRouter = typeof trpcRouter

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

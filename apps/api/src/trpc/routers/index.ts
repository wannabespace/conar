import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { router } from '..'
import { aiRouter } from './ai'
import { databasesRouter } from './databases'
import { profileRouter } from './profile'
import { usersRouter } from './users'

export const trpcRouter = router({
  ai: aiRouter,
  profile: profileRouter,
  databases: databasesRouter,
  users: usersRouter,
})

export type AppRouter = typeof trpcRouter

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

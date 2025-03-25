import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { router } from '..'
import { databasesRouter } from './databases'
import { profileRouter } from './profile'
import { workspacesRouter } from './workspaces'

export const appRouter = router({
  profile: profileRouter,
  databases: databasesRouter,
  workspaces: workspacesRouter,
})

export type AppRouter = typeof appRouter

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

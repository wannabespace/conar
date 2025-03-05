import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { router } from '..'
import { aiRouter } from './ai'
import { connectionsRouter } from './connections'
import { profileRouter } from './profile'
import { workspacesRouter } from './workspaces'

export const appRouter = router({
  profile: profileRouter,
  connections: connectionsRouter,
  workspaces: workspacesRouter,
  ai: aiRouter,
})

export type AppRouter = typeof appRouter

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

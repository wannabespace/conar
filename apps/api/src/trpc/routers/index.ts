import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { router } from '..'
import { aiRouter } from './ai'
import { chatsRouter } from './chats'
import { databasesRouter } from './databases'
import { profileRouter } from './profile'
import { usersRouter } from './users'
import { workspacesRouter } from './workspaces'

export const trpcRouter = router({
  ai: aiRouter,
  chats: chatsRouter,
  profile: profileRouter,
  databases: databasesRouter,
  workspaces: workspacesRouter,
  users: usersRouter,
})

export type AppRouter = typeof trpcRouter

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

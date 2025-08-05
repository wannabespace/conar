import type { RouterClient } from '@orpc/server'
import { orpc } from '..'
import { ai } from './ai'
import { chats } from './chats'
import { databases } from './databases'
import { queries } from './queries'

export const router = orpc.router({
  ai,
  chats,
  queries,
  databases,
})

export type ORPCRouter = RouterClient<typeof router>

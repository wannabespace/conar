import type { RouterClient } from '@orpc/server'
import { orpc } from '..'
import { ai } from './ai'
import { chats } from './chats'

export const router = orpc.router({
  ai,
  chats,
})

export type ORPCRouter = RouterClient<typeof router>

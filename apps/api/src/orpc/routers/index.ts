import type { RouterClient } from '@orpc/server'
import { orpc } from '..'
import { ai } from './ai'
import { chats } from './chats'
import { contact } from './contact'
import { databases } from './databases'
import { queries } from './queries'
import { sync } from './sync'

export const router = orpc.router({
  contact,
  ai,
  chats,
  queries,
  databases,
  sync,
})

export type ORPCRouter = RouterClient<typeof router>

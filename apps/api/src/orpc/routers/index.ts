import type { RouterClient } from '@orpc/server'
import { orpc } from '..'
import { ai } from './ai'

export const router = orpc.router({
  ai,
})

export type ORPCRouter = RouterClient<typeof router>

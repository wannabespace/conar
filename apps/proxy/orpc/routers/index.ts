import type { RouterClient } from '@orpc/server'
import { encryption } from './encryption'
import { query } from './query'

export const router = {
  encryption,
  query,
}

export type ORPCRouter = RouterClient<typeof router>

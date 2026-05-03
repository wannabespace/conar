import type { RouterClient } from '@orpc/server'
import * as encryption from './encryption'
import { query } from './query'

export const router = {
  encryption,
  query,
}

export type ORPCRouter = RouterClient<typeof router>

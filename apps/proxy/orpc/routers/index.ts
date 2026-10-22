import type { RouterClient } from '@orpc/server'

import { query } from './query'
import { shares } from './shares'

export const router = {
  query,
  shares,
}

export type ORPCRouter = RouterClient<typeof router>

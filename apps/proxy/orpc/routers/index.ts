import type { RouterClient } from '@orpc/server'

import { encryption } from './encryption'
import { query } from './query'
import { shares } from './shares'

export const router = {
  encryption,
  query,
  shares,
}

export type ORPCRouter = RouterClient<typeof router>

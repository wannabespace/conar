import { LoopsClient } from 'loops'
import { env } from '~/lib/env-server'

export const loops = new LoopsClient(env.LOOPS_API_KEY)

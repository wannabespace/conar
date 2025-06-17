import { LoopsClient } from 'loops'
import { env } from '~/env'

export const loops = env.LOOPS_API_KEY ? new LoopsClient(env.LOOPS_API_KEY) : null

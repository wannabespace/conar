import process from 'node:process'

import { type } from 'arktype'

export const envType = type({
  REDIS_URL: 'string',
})

export const env = envType.assert(process.env)

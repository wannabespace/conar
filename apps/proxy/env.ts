import process from 'node:process'

import { type } from 'arktype'

export const nodeEnv = type('"production" | "development" | "test"').assert(process.env.NODE_ENV)

const envType = type({
  API_URL: 'string',
  MAIN_URL: 'string',
  PROXY_SHARED_SECRET: 'string',
})

export const env = envType.assert(process.env)

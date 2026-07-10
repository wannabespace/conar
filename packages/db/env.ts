import process from 'node:process'
import { type } from 'arktype'

export const nodeEnv = type('"production" | "development" | "test"').assert(process.env.NODE_ENV)

export const envType = type({
  DATABASE_URL: 'string',
  ENCRYPTION_SECRET: 'string',
})

export const env = envType.assert(process.env)

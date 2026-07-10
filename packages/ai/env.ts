import process from 'node:process'
import { type } from 'arktype'

export const envType = type({
  EXA_API_KEY: 'string',
  CONTEXT7_API_KEY: 'string',
})

export const env = envType.assert(process.env)

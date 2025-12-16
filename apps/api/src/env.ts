import process from 'node:process'
import { type } from 'arktype'
import { consola } from 'consola'

export const nodeEnv = type('"production" | "development" | "test"').assert(process.env.NODE_ENV)

const envType = type({
  API_URL: 'string',
  WEB_URL: 'string',
  DATABASE_URL: 'string',
  ENCRYPTION_SECRET: 'string',
  BETTER_AUTH_SECRET: 'string',
  STRIPE_SECRET_KEY: 'string',
  REDIS_URL: 'string',
  POSTHOG_API_KEY: 'string',
  RESEND_API_KEY: 'string',
  RESEND_FROM_EMAIL: 'string',
  LOOPS_API_KEY: 'string',
  OPENAI_API_KEY: 'string',
  ANTHROPIC_API_KEY: 'string',
  GOOGLE_GENERATIVE_AI_API_KEY: 'string',
  XAI_API_KEY: 'string',
  GOOGLE_CLIENT_ID: 'string',
  GOOGLE_CLIENT_SECRET: 'string',
  GITHUB_CLIENT_ID: 'string',
  GITHUB_CLIENT_SECRET: 'string',
  BANNER_TEXT: 'string?',
  EXA_API_KEY: 'string',
  GITHUB_TOKEN: 'string',
})

const devOptionalEnvs = [
  'STRIPE_SECRET_KEY',
  'REDIS_URL',
  'POSTHOG_API_KEY',
  'RESEND_API_KEY',
  'LOOPS_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'XAI_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'EXA_API_KEY',
  'GITHUB_TOKEN',
] satisfies (keyof typeof envType.infer)[]

export const env = nodeEnv === 'production' || nodeEnv === 'test'
  ? envType.assert(process.env)
  : envType
      .merge(
        devOptionalEnvs.reduce((acc, env) => {
          acc[env] = 'string?'
          if (!process.env[env]) {
            consola.warn(`"${env}" is not set in env file`)
          }
          return acc
        }, {} as { [K in typeof devOptionalEnvs[number]]: 'string?' }),
      )
      .assert(process.env)

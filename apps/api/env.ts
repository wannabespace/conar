import process from 'node:process'

import { type } from 'arktype'

export const nodeEnv = type('"production" | "development" | "test"').assert(
  process.env.NODE_ENV
)

const envType = type({
  ALERTS_EMAIL: 'string',
  ANTHROPIC_API_KEY: 'string',
  API_URL: 'string',
  BANNER_TEXT: 'string?',
  BETTER_AUTH_SECRET: 'string',
  CONTEXT7_API_KEY: 'string',
  DATABASE_URL: 'string',
  ENCRYPTION_SECRET: 'string',
  EXA_API_KEY: 'string',
  GITHUB_CLIENT_ID: 'string',
  GITHUB_CLIENT_SECRET: 'string',
  GITHUB_TOKEN: 'string',
  GOOGLE_CLIENT_ID: 'string',
  GOOGLE_CLIENT_SECRET: 'string',
  GOOGLE_GENERATIVE_AI_API_KEY: 'string',
  MAIN_URL: 'string',
  MIN_DESKTOP_VERSION: type('string').pipe(Number),
  OPENAI_API_KEY: 'string',
  PROXY_SHARED_SECRET: 'string',
  REDIS_URL: 'string',
  RESEND_API_KEY: 'string',
  RESEND_FROM_EMAIL: 'string',
  STRIPE_ANNUAL_PRICE_ID: 'string',
  STRIPE_MONTH_PRICE_ID: 'string',
  STRIPE_SECRET_KEY: 'string',
  STRIPE_WEBHOOK_SECRET: 'string',
  TODESKTOP_WEBHOOK_SECRET: 'string',
  XAI_API_KEY: 'string',
})

const devOptionalEnvs = [
  'MIN_DESKTOP_VERSION',
  'ALERTS_EMAIL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_MONTH_PRICE_ID',
  'STRIPE_ANNUAL_PRICE_ID',
  'RESEND_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'XAI_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'EXA_API_KEY',
  'CONTEXT7_API_KEY',
  'GITHUB_TOKEN',
  'TODESKTOP_WEBHOOK_SECRET',
] satisfies (keyof typeof envType.infer)[]

export const env =
  nodeEnv === 'production' || nodeEnv === 'test'
    ? envType.assert(process.env)
    : type
        .and(
          envType.omit(...devOptionalEnvs),
          envType.pick(...devOptionalEnvs).partial()
        )
        .assert(process.env)

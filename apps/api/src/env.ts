import { type } from 'arktype'

const isProduction = process.env.NODE_ENV === 'production'

const envType = type({
  API_URL: 'string',
  WEB_URL: 'string',
  DATABASE_URL: 'string',
  ENCRYPTION_SECRET: 'string',
  BETTER_AUTH_SECRET: 'string',
  STRIPE_SECRET_KEY: 'string',
  REDIS_URL: 'string',
  LOOPS_API_KEY: 'string',
  OPENAI_API_KEY: 'string',
  ANTHROPIC_API_KEY: 'string',
  GOOGLE_GENERATIVE_AI_API_KEY: 'string',
  XAI_API_KEY: 'string',
  GOOGLE_CLIENT_ID: 'string',
  GOOGLE_CLIENT_SECRET: 'string',
  GITHUB_CLIENT_ID: 'string',
  GITHUB_CLIENT_SECRET: 'string',
})

const devOptionalEnvs = [
  'STRIPE_SECRET_KEY',
  'REDIS_URL',
  'LOOPS_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'XAI_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
] satisfies (keyof typeof envType.infer)[]

export const env = isProduction
  ? envType.assert(process.env)
  : envType
      .merge(
        devOptionalEnvs.reduce((acc, env) => {
          acc[`${env}?`] = 'string'
          if (!process.env[env]) {
            console.warn(`"${env}" is not set in env file`)
          }
          return acc
        }, {} as { [K in `${typeof devOptionalEnvs[number]}?`]: 'string' }),
      )
      .assert(process.env)

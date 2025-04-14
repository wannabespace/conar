import { type } from 'arktype'

const envType = type({
  API_URL: 'string > 1',
  WEB_URL: 'string > 1',
  DATABASE_URL: 'string > 1',
  ENCRYPTION_SECRET: 'string > 1',
  BETTER_AUTH_SECRET: 'string > 1',
  STRIPE_SECRET_KEY: 'string > 1',
  LOOPS_API_KEY: 'string > 1',
  OPENAI_API_KEY: 'string > 1',
  ANTHROPIC_API_KEY: 'string > 1',
  GOOGLE_GENERATIVE_AI_API_KEY: 'string > 1',
  XAI_API_KEY: 'string > 1',
  GOOGLE_CLIENT_ID: 'string > 1',
  GOOGLE_CLIENT_SECRET: 'string > 1',
  GITHUB_CLIENT_ID: 'string > 1',
  GITHUB_CLIENT_SECRET: 'string > 1',
})

export const env = envType.assert(process.env)

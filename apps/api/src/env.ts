import { type } from 'arktype'

const envType = type({
  API_URL: 'string > 0',
  WEB_URL: 'string > 0',
  DATABASE_URL: 'string > 0',
  ENCRYPTION_SECRET: 'string > 0',
  BETTER_AUTH_SECRET: 'string > 0',
  STRIPE_SECRET_KEY: 'string > 0',
  LOOPS_API_KEY: 'string > 0',
  OPENAI_API_KEY: 'string > 0',
  ANTHROPIC_API_KEY: 'string > 0',
  GOOGLE_GENERATIVE_AI_API_KEY: 'string > 0',
  XAI_API_KEY: 'string > 0',
  GOOGLE_CLIENT_ID: 'string > 0',
  GOOGLE_CLIENT_SECRET: 'string > 0',
  GITHUB_CLIENT_ID: 'string > 0',
  GITHUB_CLIENT_SECRET: 'string > 0',
})

export const env = envType.assert(process.env)

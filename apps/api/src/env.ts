import { z } from 'zod'

const envSchema = z.object({
  API_URL: z.string().min(1),
  WEB_URL: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  ENCRYPTION_SECRET: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  LOOPS_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  XAI_API_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
})

export const env = envSchema.parse(process.env)

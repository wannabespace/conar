import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '~/env'
import * as auth from './schema/auth'
import * as databases from './schema/databases'

export * from './schema/auth'
export * from './schema/databases'

const client = postgres(env.DATABASE_URL)

export const db = drizzle(client, {
  logger: true,
  schema: {
    ...auth,
    ...databases,
  },
  casing: 'snake_case',
})

import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { drizzle } from 'drizzle-orm/postgres-js'
import { env, nodeEnv } from '~/env'
import * as auth from './schema/auth'
import * as chats from './schema/chats'
import * as databases from './schema/databases'
import * as queries from './schema/queries'
import '@electric-sql/pglite'

export * from './schema/auth'
export * from './schema/chats'
export * from './schema/databases'
export * from './schema/queries'

const config = {
  logger: true,
  schema: {
    ...auth,
    ...databases,
    ...chats,
    ...queries,
  },
  casing: 'snake_case',
} satisfies Parameters<typeof drizzle>[1]

export const db = nodeEnv === 'test'
  ? drizzlePglite(env.DATABASE_URL, config)
  : drizzle(env.DATABASE_URL, config)

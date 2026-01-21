import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { drizzle } from 'drizzle-orm/postgres-js'
import { env, nodeEnv } from '~/env'
import * as auth from './schema/auth'
import * as chats from './schema/chats'
import * as connections from './schema/connections'
import * as queries from './schema/queries'
import * as subscriptions from './schema/subscriptions'
import '@electric-sql/pglite'

export * from './schema/auth'
export * from './schema/chats'
export * from './schema/connections'
export * from './schema/queries'
export * from './schema/subscriptions'

const config = {
  logger: true,
  schema: {
    ...auth,
    ...connections,
    ...chats,
    ...queries,
    ...subscriptions,
  },
  casing: 'snake_case',
} satisfies Parameters<typeof drizzle>[1]

export const db = nodeEnv === 'test'
  ? drizzlePglite(env.DATABASE_URL, config)
  : drizzle(env.DATABASE_URL, config)

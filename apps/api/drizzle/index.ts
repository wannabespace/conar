import { drizzle } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { env, nodeEnv } from '~/env'
import { authRelations } from './schema/auth'
import { chatsRelations } from './schema/chats'
import { connectionsRelations } from './schema/connections'
import { queriesRelations } from './schema/queries'
import '@electric-sql/pglite'

export * from './schema/auth'
export * from './schema/chats'
export * from './schema/connections'
export * from './schema/queries'
export * from './schema/subscriptions'

const config = {
  relations: {
    ...authRelations,
    ...chatsRelations,
    ...connectionsRelations,
    ...queriesRelations,
  },
  casing: 'snake_case',
} satisfies Parameters<typeof drizzle>[1]

export const db = nodeEnv === 'test'
  ? drizzlePglite(env.DATABASE_URL, config)
  : drizzle(env.DATABASE_URL, config)

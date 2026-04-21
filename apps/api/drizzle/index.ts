import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { env, nodeEnv } from '~/env'
import { authRelations } from './schema/auth'
import { chatsRelations } from './schema/chats'
import { connectionsRelations } from './schema/connections'
import { queriesRelations } from './schema/queries'
import '@electric-sql/pglite'

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
  ? drizzlePglite(env.DATABASE_URL, config) as unknown as NodePgDatabase<Record<string, never>, typeof config['relations']>
  : drizzle(env.DATABASE_URL, config)

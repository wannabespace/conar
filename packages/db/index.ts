import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import process from 'node:process'
import { drizzle } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { authRelations } from './schema/auth'
import { chatsRelations } from './schema/chats'
import { connectionsRelations } from './schema/connections'
import { queriesRelations } from './schema/queries'
import '@electric-sql/pglite'

export const relations = {
  ...authRelations,
  ...chatsRelations,
  ...connectionsRelations,
  ...queriesRelations,
}

const config = {
  relations,
} satisfies Parameters<typeof drizzle>[1]

export const db = process.env.NODE_ENV === 'test'
  ? drizzlePglite(process.env.DATABASE_URL!, config) as unknown as NodePgDatabase<typeof config['relations']>
  : drizzle(process.env.DATABASE_URL!, config)

import { drizzle } from 'drizzle-orm/node-postgres'

import { env } from './env'
import { authRelations } from './schema/auth'
import { chatsRelations } from './schema/chats'
import { connectionsRelations } from './schema/connections'
import { queriesRelations } from './schema/queries'

export const relations = {
  ...authRelations,
  ...chatsRelations,
  ...connectionsRelations,
  ...queriesRelations,
}

export const db = drizzle(env.DATABASE_URL!, {
  relations,
})

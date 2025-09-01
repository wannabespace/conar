import { drizzle } from 'drizzle-orm/bun-sql'
import { env } from '~/env'
import * as auth from './schema/auth'
import * as chats from './schema/chats'
import * as databases from './schema/databases'
import * as queries from './schema/queries'

export * from './schema/auth'
export * from './schema/chats'
export * from './schema/databases'
export * from './schema/queries'

export const db = drizzle(env.DATABASE_URL, {
  logger: true,
  schema: {
    ...auth,
    ...databases,
    ...chats,
    ...queries,
  },
  casing: 'snake_case',
})

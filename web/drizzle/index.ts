import { createConsola } from 'consola'
import { colorize } from 'consola/utils'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '~/env'
import * as auth from './schema/auth'
// import * as subscriptions from './schema/subscriptions'

// export * from './schema/subscriptions'

const client = postgres(env.DATABASE_URL!)

const logger = createConsola({
  formatOptions: {
    date: false,
  },
})

export const db = drizzle(client, {
  logger: {
    logQuery: (query, params) => {
      let q = query

      if (params.length) {
        params.forEach((p, i) => {
          if (typeof p === 'string') {
            q = q.replace(`$${i + 1}`, `'${p}'`)
          }
          else {
            q = q.replace(`$${i + 1}`, String(p))
          }
        })
      }

      logger.log(`${colorize('cyan', 'DB')} ${colorize('dim', q)}`)
    },
  },
  schema: {
    ...auth,
    // ...subscriptions,
  },
})

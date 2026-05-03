/* eslint-disable perfectionist/sort-imports */
import '@conar/shared/arktype-config'
import process from 'node:process'
import { PORTS } from '@conar/shared/constants'
import { ORPCError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env, nodeEnv } from './env'
import { createContext } from './orpc/context'
import { router } from './orpc/routers'
import { sanitizeLogData } from '@conar/shared/utils/sanitize-log'

const handler = new RPCHandler(router, {
  interceptors: [
    async (options) => {
      try {
        return await options.next()
      }
      catch (error) {
        options.context.addLogData({
          error: {
            type: error instanceof Error ? error.constructor.name : typeof error,
            message: error instanceof Error ? error.message : String(error),
            cause: error instanceof Error ? error.cause : undefined,
            stack: error instanceof Error ? error.stack : undefined,
          },
        })

        if (error instanceof ORPCError) {
          throw error
        }

        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'An unexpected error occurred' })
      }
    },
  ],
})

export interface AppVariables {
  logEvent?: Record<string, unknown>
}

const app = new Hono<{
  Variables: AppVariables
}>()
  .use(cors({
    origin(origin) {
      const allowedOrigins = [
        env.MAIN_URL,
        ...(nodeEnv === 'development' ? [`http://localhost:${PORTS.DEV.DESKTOP}`, `http://localhost:${PORTS.DEV.APP}`] : []),
        ...(nodeEnv === 'test' ? [`http://localhost:${PORTS.TEST.DESKTOP}`, `http://localhost:${PORTS.TEST.APP}`] : []),
      ]
      return origin.endsWith(`.${new URL(env.MAIN_URL).host}`) || allowedOrigins.includes(origin) ? origin : null
    },
    credentials: true,
  }))
  .get('/', c => c.redirect(env.MAIN_URL))
  .use('*', async (c, next) => {
    const startTime = Date.now()
    c.set('logEvent', {})

    await next()

    const status = c.res.status
    const method = c.req.method
    const path = new URL(c.req.url).pathname
    const userAgent = c.req.header('User-Agent')
    const logEvent = c.get('logEvent') || {}

    if (!logEvent.userId && c.req.header('user-id')) {
      logEvent.userId = c.req.header('user-id')
    }

    const logInfo = {
      method,
      status,
      path,
      duration: `${Date.now() - startTime}ms`,
      ...(userAgent ? { userAgent } : {}),
      ...sanitizeLogData(logEvent),
    }

    const log = JSON.stringify(logInfo, null, nodeEnv === 'production' ? undefined : 2)

    if (status >= 400) {
      console.error(log)
    }
    else {
      // eslint-disable-next-line no-console
      console.info(log)
    }
  })
  .use('/rpc/*', async (c, next) => {
    const { matched, response } = await handler.handle(c.req.raw.clone(), {
      prefix: '/rpc',
      context: createContext(c),
    })

    if (matched) {
      return c.newResponse(response.body, response)
    }

    await next()
  })

export default {
  fetch: app.fetch,
  port: process.env.PORT
    ? Number(process.env.PORT)
    : nodeEnv === 'test' ? PORTS.TEST.PROXY : PORTS.DEV.PROXY,
}

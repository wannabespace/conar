import '@tamery/shared/arktype-config'
import process from 'node:process'

import { ORPCError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { sanitizeLogData } from '@tamery/shared/utils/sanitize-log'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { env, nodeEnv } from './env'
import { createContext } from './orpc/context'
import { router } from './orpc/routers'

const handler = new RPCHandler(router, {
  interceptors: [
    async options => {
      try {
        return await options.next()
      } catch (error) {
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

        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message, cause: error })
        }

        throw error
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
  .use(
    cors({
      origin(origin) {
        const allowedOrigins = ['https://tamery.app']
        if (nodeEnv === 'development' && origin.startsWith('http://localhost:')) return origin
        return origin.endsWith('.tamery.app') || allowedOrigins.includes(origin) ? origin : null
      },
      credentials: true,
    }),
  )
  .get('/', c => c.redirect(env.MAIN_URL))
  .use('*', async (c, next) => {
    const startTime = Date.now()
    c.set('logEvent', {})

    await next()

    const status = c.res.status
    const method = c.req.method
    const path = new URL(c.req.url).pathname
    const userAgent = c.req.header('User-Agent')
    const version = c.req.header('x-desktop-version')
    const logEvent = c.get('logEvent') || {}

    if (!logEvent.userId && c.req.header('user-id')) {
      logEvent.userId = c.req.header('user-id')
    }

    const body = status >= 400 ? await c.res.clone().text() : undefined

    const logInfo = {
      method,
      status,
      path,
      duration: `${Date.now() - startTime}ms`,
      ...(version ? { version } : {}),
      ...(userAgent ? { userAgent } : {}),
      ...(body !== undefined ? { body } : {}),
      ...sanitizeLogData(logEvent),
    }

    const log = JSON.stringify(logInfo, null, nodeEnv === 'production' ? undefined : 2)

    if (status >= 400) {
      console.error(log)
    } else {
      // oxlint-disable-next-line no-console
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
  port: Number(process.env.PORT || 3004),
}

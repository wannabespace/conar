import '@tamery/shared/arktype-config'
import process from 'node:process'

import { ORPCError, ValidationError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { sanitizeLogData } from '@tamery/shared/utils/sanitize-log'
import { sleep } from 'bun'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { env, nodeEnv } from './env'
import { auth } from './lib/auth'
import { sendEmail } from './lib/resend'
import { createContext } from './orpc/context'
import { router } from './orpc/routers'
import { healthRouter } from './routers/health'

const handler = new RPCHandler(router, {
  interceptors: [
    async ({ next, context }) => {
      try {
        await sleep(500)
        return await next()
      } catch (error) {
        context.addLogData({
          error: {
            type: error instanceof Error ? error.constructor.name : typeof error,
            message: error instanceof Error ? error.message : String(error),
            cause: error instanceof Error ? error.cause : undefined,
            stack: error instanceof Error ? error.stack : undefined,
          },
        })

        if (error instanceof ORPCError) {
          if (error.cause instanceof ValidationError) {
            const message = error.cause.issues
              .map(issue =>
                issue.path
                  ? `${issue.path.join('.')}: ${issue.message.toLowerCase()}`
                  : issue.message,
              )
              .join(', ')

            throw new ORPCError('BAD_REQUEST', { message })
          }

          throw error
        }

        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'An unexpected error occurred' })
      }
    },
  ],
})

export interface AppVariables {
  isAppOutdated: boolean
  parsedAppVersion: {
    major: number
    minor: number
    patch: number
  } | null
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
    const xAppVersion =
      (c.req.header('x-app-version') || c.req.header('x-desktop-version'))?.split('.') || null
    c.set('logEvent', {})
    const parsedAppVersion = xAppVersion
      ? {
          major: Number(xAppVersion[0]),
          minor: Number(xAppVersion[1]),
          patch: Number(xAppVersion[2]),
        }
      : null
    c.set('parsedAppVersion', parsedAppVersion)
    c.set(
      'isAppOutdated',
      !!env.MIN_DESKTOP_VERSION &&
        !!parsedAppVersion?.minor &&
        parsedAppVersion.minor < env.MIN_DESKTOP_VERSION,
    )

    await next()

    const status = c.res.status
    const method = c.req.method
    const path = new URL(c.req.url).pathname
    const userAgent = c.req.header('User-Agent')
    const version = c.req.header('x-app-version')
    const logEvent = c.get('logEvent') || {}

    if (!logEvent.userId && c.req.header('user-id')) {
      logEvent.userId = c.req.header('user-id')
    }

    const logInfo = {
      method,
      status,
      path,
      duration: `${Date.now() - startTime}ms`,
      ...(version ? { version } : {}),
      ...(userAgent ? { userAgent } : {}),
      ...sanitizeLogData(logEvent),
    }

    if (
      status >= 400 &&
      status !== 401 &&
      status !== 404 &&
      env.ALERTS_EMAIL &&
      !c.req.url.includes('healthcheck.railway.app')
    ) {
      sendEmail({
        to: env.ALERTS_EMAIL,
        subject: `Alert from API: ${status} ${method} ${c.req.url}`,
        template: 'Alert',
        props: {
          text: JSON.stringify(logInfo, null, 2),
          service: 'API',
        },
      })
    }

    const log = JSON.stringify(logInfo, null, nodeEnv === 'production' ? undefined : 2)

    if (status >= 400) {
      console.error(log)
    } else {
      // oxlint-disable-next-line no-console
      console.info(log)
    }
  })
  .on(['GET', 'POST'], '/auth/*', c => {
    const req = c.req.raw

    const origin = req.headers.get('origin')

    if (!origin) {
      req.headers.set('origin', 'file://')
    }

    return auth.handler(req)
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
  .route('/health', healthRouter)

export default {
  fetch: app.fetch,
  port: Number(process.env.PORT || 3000),
}

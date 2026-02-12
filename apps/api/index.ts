/* eslint-disable perfectionist/sort-imports */
import '@conar/shared/arktype-config'
import process from 'node:process'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { PORTS } from '@conar/shared/constants'
import { ORPCError, ValidationError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { generateText } from 'ai'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { db, users } from './drizzle'
import { env, nodeEnv } from './env'
import { auth } from './lib/auth'
import { createContext } from './orpc/context'
import { router } from './orpc/routers'
import { sendEmail } from './lib/resend'

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
          if (error.cause instanceof ValidationError) {
            const message = error.cause.issues.map(issue => issue.path
              ? `${issue.path.join('.')}: ${issue.message.toLowerCase()}`
              : issue.message,
            ).join(', ')

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
  logEvent: Record<string, unknown>
}

const app = new Hono<{
  Variables: AppVariables
}>()
  .use(cors({
    origin: [
      env.WEB_URL,
      ...(nodeEnv === 'development' ? [`http://localhost:${PORTS.DEV.DESKTOP}`] : []),
      ...(nodeEnv === 'test' ? [`http://localhost:${PORTS.TEST.DESKTOP}`] : []),
    ],
    credentials: true,
  }))
  .get('/', c => c.redirect(env.WEB_URL))
  .use('*', async (c, next) => {
    const startTime = Date.now()
    c.set('logEvent', {})

    await next()

    const status = c.res.status
    const method = c.req.method
    const path = new URL(c.req.url).pathname

    if (
      status >= 400
      && status !== 401
      && status !== 404
      && env.ALERTS_EMAIL
      && !c.req.url.includes('healthcheck.railway.app')
    ) {
      sendEmail({
        to: env.ALERTS_EMAIL,
        subject: `Alert from API: ${status} ${method} ${c.req.url}`,
        template: 'Alert',
        props: {
          text: JSON.stringify({
            status,
            method,
            url: c.req.url,
            auth: c.req.header('Authorization'),
            cookie: c.req.header('Cookie'),
            userAgent: c.req.header('User-Agent'),
            desktopVersion: c.req.header('x-desktop-version'),
          }, null, 2),
          service: 'API',
        },
      })
    }

    const auth = c.req.header('Authorization')
    const userAgent = c.req.header('User-Agent')
    const desktopVersion = c.req.header('x-desktop-version')
    const logEvent = c.get('logEvent') || {}

    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      method,
      status,
      path,
      ...(auth ? { auth } : {}),
      duration: `${Date.now() - startTime}ms`,
      ...(desktopVersion ? { desktopVersion } : {}),
      ...(userAgent ? { userAgent } : {}),
      ...logEvent,
    }, null, nodeEnv === 'production' ? undefined : 2))
  })
  .on(['GET', 'POST'], '/auth/*', (c) => {
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
  .get('/health', async (c) => {
    const hostname = c.req.header('host')
    if (hostname !== 'healthcheck.railway.app') {
      return c.json({
        status: 'error',
        message: 'Invalid healthcheck host',
      }, 400)
    }

    function createAnswer(type: 'error' | 'ok', service: string, message: string) {
      return {
        status: type,
        service,
        message,
      }
    }

    const promises = await Promise.all([
      db
        .select()
        .from(users)
        .limit(1)
        .then(([user]) => {
          if (!user) {
            throw new Error('User not found')
          }

          return user
        })
        .then(() => createAnswer('ok', 'database', 'Database connection ok'))
        .catch(e => createAnswer('error', 'database', e instanceof Error ? e.message : 'Database connection failed')),
      generateText({
        model: openai('gpt-4.1-nano'),
        prompt: 'Hello, how are you?',
      })
        .then((result) => {
          if (!result.text) {
            return createAnswer('error', 'openai', 'OpenAI connection failed')
          }

          return createAnswer('ok', 'openai', result.text)
        })
        .catch(e => createAnswer('error', 'openai', e instanceof Error ? e.message : 'OpenAI connection failed')),
      generateText({
        model: google('gemini-2.0-flash'),
        prompt: 'Hello, how are you?',
      })
        .then((result) => {
          if (!result.text) {
            return createAnswer('error', 'google', 'Google connection failed')
          }

          return createAnswer('ok', 'google', result.text)
        })
        .catch(e => createAnswer('error', 'google', e instanceof Error ? e.message : 'Google connection failed')),
      generateText({
        model: anthropic('claude-3-5-haiku-latest'),
        prompt: 'Hello, how are you?',
      })
        .then((result) => {
          if (!result.text) {
            return createAnswer('error', 'anthropic', 'Anthropic connection failed')
          }

          return createAnswer('ok', 'anthropic', result.text)
        })
        .catch(e => createAnswer('error', 'anthropic', e instanceof Error ? e.message : 'Anthropic connection failed')),
      generateText({
        model: xai('grok-3-mini'),
        prompt: 'Hello, how are you?',
      })
        .then((result) => {
          if (!result.text) {
            return createAnswer('error', 'xai', 'XAI connection failed')
          }

          return createAnswer('ok', 'xai', result.text)
        })
        .catch(e => createAnswer('error', 'xai', e instanceof Error ? e.message : 'XAI connection failed')),
    ])

    const error = promises.find(promise => promise.status === 'error')

    if (error) {
      return c.json(error, 500)
    }

    return c.json({
      status: 'ok',
    })
  })

export default {
  fetch: app.fetch,
  port: process.env.PORT
    ? Number(process.env.PORT)
    : nodeEnv === 'test' ? PORTS.TEST.API : PORTS.DEV.API,
}

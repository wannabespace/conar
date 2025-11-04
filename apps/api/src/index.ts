import process from 'node:process'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { PORTS } from '@conar/shared/constants'
import { trpcServer } from '@hono/trpc-server'
import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { generateText } from 'ai'
import { consola } from 'consola'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { db, users } from './drizzle'
import { env, nodeEnv } from './env'
import { auth } from './lib/auth'
import { router } from './orpc/routers'
import { ai } from './routers/__ai__deprecated'
import { createContext } from './trpc/context'
import { trpcRouter } from './trpc/routers'

const app = new Hono()

app.use(logger())
app.use(cors({
  origin: [
    env.WEB_URL,
    ...(nodeEnv === 'development' ? [`http://localhost:${PORTS.DEV.DESKTOP}`] : []),
    ...(nodeEnv === 'test' ? [`http://localhost:${PORTS.TEST.DESKTOP}`] : []),
  ],
  credentials: true,
}))

app.get('/', (c) => {
  return c.redirect(env.WEB_URL)
})

app.on(['GET', 'POST'], '/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

app.use(
  '/trpc/*',
  trpcServer({
    router: trpcRouter,
    createContext: (_, c) => createContext(c),
  }),
)

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      consola.error(error)
    }),
    async ({ request, next }) => {
      consola.log('Desktop version: ', request.headers['x-desktop-version'] || 'Unknown')
      return next()
    },
  ],
})

app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: '/rpc',
    context: createContext(c),
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  await next()
})

app.route('/ai', ai)

function createAnswer(type: 'error' | 'ok', service: string, message: string) {
  return {
    status: type,
    service,
    message,
  }
}

app.get('/health', async (c) => {
  const hostname = c.req.header('host')
  if (hostname !== 'healthcheck.railway.app') {
    return c.json({
      status: 'error',
      message: 'Invalid healthcheck host',
    }, 400)
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

  if (promises.some(promise => promise.status === 'error')) {
    return c.json(promises.find(promise => promise.status === 'error'), 500)
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

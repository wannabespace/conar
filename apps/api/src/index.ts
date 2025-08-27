import { trpcServer } from '@hono/trpc-server'
import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env'
import { auth } from './lib/auth'
import { router } from './orpc/routers'
import { ai } from './routers/ai'
import { createContext } from './trpc/context'
import { trpcRouter } from './trpc/routers'

const app = new Hono()

app.use(logger())
app.use(cors({
  origin: [env.WEB_URL, 'http://localhost:3002'],
  credentials: true,
}))

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
      console.error(error)
    }),
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

export default {
  fetch: app.fetch,
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
}

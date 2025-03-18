import { serve } from '@hono/node-server'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env'
import { auth } from './lib/auth'
import { createContext } from './trpc/context'
import { appRouter } from './trpc/routers'

const app = new Hono()

app.use(logger())
app.use(cors({
  origin: [env.WEB_URL, 'http://localhost:3002'],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'trpc-accept'],
  exposeHeaders: ['Set-Auth-Token'],
}))

app.on(['GET', 'POST'], '/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: (_, c) => createContext(c),
  }),
)

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

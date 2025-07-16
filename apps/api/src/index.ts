import { serve } from '@hono/node-server'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env'
import { auth } from './lib/auth'
import { ai as aiV1 } from './routers/ai/v1'
import { ai as aiV2 } from './routers/ai/v2'
import { createContext } from './trpc/context'
import { appRouter } from './trpc/routers'

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
    router: appRouter,
    createContext: (_, c) => createContext(c),
  }),
)

app.route('/ai', aiV1)
app.route('/ai/v2', aiV2)

serve({
  fetch: app.fetch,
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

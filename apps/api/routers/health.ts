import { probeAi } from '@tamery/ai/models'
import { db } from '@tamery/db'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

export const healthRouter = new Hono().get('/', async (c) => {
  const hostname = c.req.header('host')
  if (hostname !== 'healthcheck.railway.app') {
    return c.json(
      {
        message: 'Invalid healthcheck host',
        status: 'error',
      },
      400
    )
  }

  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const createAnswer = (
    status: 'error' | 'ok',
    service: string,
    message: string
  ) => ({
    message,
    service,
    status,
  })

  const promises = await Promise.all([
    db
      .execute(sql`select 1`)
      .then(() => createAnswer('ok', 'database', 'Database connection ok'))
      .catch((error) =>
        createAnswer(
          'error',
          'database',
          error instanceof Error ? error.message : 'Database connection failed'
        )
      ),
    probeAi()
      .then((text) =>
        text
          ? createAnswer('ok', 'openrouter', text)
          : createAnswer('error', 'openrouter', 'OpenRouter connection failed')
      )
      .catch((error) =>
        createAnswer(
          'error',
          'openrouter',
          error instanceof Error
            ? error.message
            : 'OpenRouter connection failed'
        )
      ),
  ])

  const error = promises.find((promise) => promise.status === 'error')

  if (error) {
    return c.json(error, 500)
  }

  return c.json({
    status: 'ok',
  })
})

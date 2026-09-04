import { providers } from '@tamery/ai/health'
import { db } from '@tamery/db'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

const providerLabels = {
  anthropic: 'Anthropic',
  google: 'Google',
  openai: 'OpenAI',
  xai: 'XAI',
}

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
    ...providers.list.map((provider) => {
      const failed = `${providerLabels[provider]} connection failed`
      return providers
        .probe(provider)
        .then((text) =>
          text
            ? createAnswer('ok', provider, text)
            : createAnswer('error', provider, failed)
        )
        .catch((error) =>
          createAnswer(
            'error',
            provider,
            error instanceof Error ? error.message : failed
          )
        )
    }),
  ])

  const error = promises.find((promise) => promise.status === 'error')

  if (error) {
    return c.json(error, 500)
  }

  return c.json({
    status: 'ok',
  })
})
